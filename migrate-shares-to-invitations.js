#!/usr/bin/env node

/**
 * Script de migration des partages existants vers le nouveau système d'invitations
 * 
 * Ce script convertit automatiquement tous les partages existants (NoteShare)
 * en accès direct (NoteAccess) avec permission READ par défaut.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateShares() {
  console.log('🔄 Début de la migration des partages vers le système d\'invitations');
  console.log('=================================================================\n');

  try {
    // === ÉTAPE 1: Récupérer tous les partages existants ===
    console.log('1️⃣  Récupération des partages existants...');
    
    const existingShares = await prisma.noteShare.findMany({
      include: {
        note: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        }
      }
    });

    console.log(`   📊 ${existingShares.length} partages trouvés\n`);

    if (existingShares.length === 0) {
      console.log('✅ Aucun partage existant à migrer. Migration terminée.');
      return;
    }

    // === ÉTAPE 2: Analyser les partages ===
    console.log('2️⃣  Analyse des partages...');
    
    const sharesByNote = {};
    const usersToFind = new Set();

    for (const share of existingShares) {
      if (!sharesByNote[share.noteId]) {
        sharesByNote[share.noteId] = [];
      }
      sharesByNote[share.noteId].push(share);
      usersToFind.add(share.email);
    }

    console.log(`   📝 ${Object.keys(sharesByNote).length} notes concernées`);
    console.log(`   👥 ${usersToFind.size} emails uniques\n`);

    // === ÉTAPE 3: Trouver les utilisateurs correspondants ===
    console.log('3️⃣  Recherche des utilisateurs correspondants...');
    
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: Array.from(usersToFind)
        }
      }
    });

    const emailToUserId = {};
    users.forEach(user => {
      emailToUserId[user.email] = user.id;
    });

    console.log(`   ✅ ${users.length} utilisateurs trouvés dans la base`);
    console.log(`   ⚠️  ${usersToFind.size - users.length} emails externes (pas d'utilisateurs)\n`);

    // === ÉTAPE 4: Créer les accès pour les utilisateurs existants ===
    console.log('4️⃣  Création des accès directs...');
    
    let accessCreated = 0;
    const accessToCreate = [];

    for (const share of existingShares) {
      const userId = emailToUserId[share.email];
      
      if (userId && userId !== share.note.userId) { // Ne pas créer d'accès pour le propriétaire
        accessToCreate.push({
          noteId: share.noteId,
          userId: userId,
          permission: 'READ', // Permission par défaut
          grantedBy: share.note.userId,
          grantedAt: share.createdAt
        });
      }
    }

    console.log(`   📋 ${accessToCreate.length} accès à créer`);

    // Créer les accès en lot
    if (accessToCreate.length > 0) {
      for (const access of accessToCreate) {
        try {
          await prisma.noteAccess.create({
            data: access
          });
          accessCreated++;
        } catch (error) {
          console.log(`   ⚠️  Erreur lors de la création d'accès pour note ${access.noteId} user ${access.userId}: ${error.message}`);
        }
      }
    }

    console.log(`   ✅ ${accessCreated} accès créés avec succès\n`);

    // === ÉTAPE 5: Résumé de la migration ===
    console.log('5️⃣  Résumé de la migration...');
    
    console.log('   📊 Résultats:');
    console.log(`      - Partages originaux: ${existingShares.length}`);
    console.log(`      - Accès créés: ${accessCreated}`);
    console.log(`      - Emails externes ignorés: ${usersToFind.size - users.length}`);

    // === ÉTAPE 6: Instructions pour la suite ===
    console.log('\n6️⃣  Instructions pour finaliser la migration...');
    console.log('   1. Vérifiez que les accès ont été créés correctement');
    console.log('   2. Testez le nouveau système d\'invitations'); 
    console.log('   3. Lancez `npx prisma db push --accept-data-loss` pour supprimer définitivement les anciens partages');
    console.log('   4. Pour les emails externes, vous devrez envoyer de nouvelles invitations\n');

    // === ÉTAPE 7: Sauvegarder la liste des emails externes ===
    const externalEmails = [];
    for (const share of existingShares) {
      if (!emailToUserId[share.email]) {
        externalEmails.push({
          email: share.email,
          noteId: share.noteId,
          noteTitle: share.note.title,
          noteOwner: share.note.user.email
        });
      }
    }

    if (externalEmails.length > 0) {
      console.log('📧 Emails externes à re-inviter:');
      externalEmails.forEach(ext => {
        console.log(`   - ${ext.email} pour la note "${ext.noteTitle}" de ${ext.noteOwner}`);
      });
      console.log('');
    }

    console.log('=================================================================');
    console.log('✅ Migration des partages terminée avec succès !');
    console.log('📝 Les anciens partages sont prêts à être supprimés.');

  } catch (error) {
    console.error('❌ Erreur pendant la migration:', error);
    throw error;
  }
}

// Exécution du script
async function main() {
  try {
    await migrateShares();
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Gestion propre de l'arrêt du script
process.on('SIGINT', async () => {
  console.log('\n⏹️  Interruption du script...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);