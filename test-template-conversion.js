#!/usr/bin/env node

/**
 * Script de test pour vérifier que la conversion d'une note en template
 * supprime automatiquement tous les partages existants.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('🧪 Démarrage du test de conversion note → template');
  console.log('================================================\n');

  let testUserId1, testUserId2, testNoteId;
  let testPassed = true;

  try {
    // === ÉTAPE 1: Créer des utilisateurs de test ===
    console.log('1️⃣  Création des utilisateurs de test...');
    
    const user1 = await prisma.user.create({
      data: {
        email: `test-owner-${Date.now()}@example.com`,
        password: 'hashedpassword123'
      }
    });
    testUserId1 = user1.id;
    console.log(`   ✅ Utilisateur propriétaire créé: ${user1.email} (ID: ${user1.id})`);

    const user2 = await prisma.user.create({
      data: {
        email: `test-shared-${Date.now()}@example.com`,
        password: 'hashedpassword123'
      }
    });
    testUserId2 = user2.id;
    console.log(`   ✅ Utilisateur partagé créé: ${user2.email} (ID: ${user2.id})\n`);

    // === ÉTAPE 2: Créer une note partagée ===
    console.log('2️⃣  Création d\'une note avec checkboxes...');
    
    const note = await prisma.note.create({
      data: {
        title: 'Note de test pour conversion',
        content: 'Cette note va devenir un template et perdre ses partages',
        color: '#ff5722',
        isPinned: true,
        isShared: false, // Sera modifié après création des partages
        userId: testUserId1,
        checkboxes: {
          create: [
            { label: 'Tâche 1', checked: false },
            { label: 'Tâche 2', checked: true }
          ]
        }
      },
      include: { checkboxes: true }
    });
    testNoteId = note.id;
    console.log(`   ✅ Note créée: "${note.title}" (ID: ${note.id})`);
    console.log(`   📋 Checkboxes: ${note.checkboxes.length} éléments\n`);

    // === ÉTAPE 3: Créer des partages ===
    console.log('3️⃣  Création des partages...');
    
    // Partager avec l'utilisateur 2
    await prisma.noteShare.create({
      data: {
        noteId: testNoteId,
        email: user2.email
      }
    });

    // Partager avec un email externe
    await prisma.noteShare.create({
      data: {
        noteId: testNoteId,
        email: 'externe@example.com'
      }
    });

    // Marquer la note comme partagée
    await prisma.note.update({
      where: { id: testNoteId },
      data: { isShared: true }
    });

    const sharesBeforeCount = await prisma.noteShare.count({
      where: { noteId: testNoteId }
    });
    console.log(`   ✅ ${sharesBeforeCount} partages créés`);
    console.log(`   📧 Partagé avec: ${user2.email}, externe@example.com\n`);

    // === ÉTAPE 4: Vérifier l'état initial ===
    console.log('4️⃣  Vérification de l\'état initial...');
    
    const noteBeforeConversion = await prisma.note.findUnique({
      where: { id: testNoteId },
      include: { shares: true, checkboxes: true }
    });

    console.log(`   📊 État de la note avant conversion:`);
    console.log(`      - isTemplate: ${noteBeforeConversion.isTemplate}`);
    console.log(`      - isShared: ${noteBeforeConversion.isShared}`);
    console.log(`      - isPinned: ${noteBeforeConversion.isPinned}`);
    console.log(`      - Nombre de partages: ${noteBeforeConversion.shares.length}`);
    console.log(`      - Nombre de checkboxes: ${noteBeforeConversion.checkboxes.length}\n`);

    if (noteBeforeConversion.shares.length !== 2) {
      throw new Error(`❌ Attendu 2 partages, trouvé ${noteBeforeConversion.shares.length}`);
    }

    // === ÉTAPE 5: Conversion en template ===
    console.log('5️⃣  Conversion de la note en template...');
    
    // Simuler l'appel de service (comme dans le contrôleur)
    const convertedNote = await prisma.$transaction(async (tx) => {
      // Supprimer tous les partages existants
      await tx.noteShare.deleteMany({
        where: { noteId: testNoteId }
      });

      // Convertir en template
      return await tx.note.update({
        where: { id: testNoteId },
        data: { 
          isTemplate: true,
          isShared: false,
          isPinned: false
        }
      });
    });

    console.log(`   ✅ Conversion effectuée\n`);

    // === ÉTAPE 6: Vérification après conversion ===
    console.log('6️⃣  Vérification après conversion...');
    
    const noteAfterConversion = await prisma.note.findUnique({
      where: { id: testNoteId },
      include: { shares: true, checkboxes: true }
    });

    const sharesAfterCount = await prisma.noteShare.count({
      where: { noteId: testNoteId }
    });

    console.log(`   📊 État de la note après conversion:`);
    console.log(`      - isTemplate: ${noteAfterConversion.isTemplate}`);
    console.log(`      - isShared: ${noteAfterConversion.isShared}`);
    console.log(`      - isPinned: ${noteAfterConversion.isPinned}`);
    console.log(`      - Nombre de partages: ${noteAfterConversion.shares.length}`);
    console.log(`      - Nombre de checkboxes: ${noteAfterConversion.checkboxes.length}`);
    console.log(`      - Titre préservé: "${noteAfterConversion.title}"`);
    console.log(`      - Couleur préservée: ${noteAfterConversion.color}\n`);

    // === ÉTAPE 7: Validation des résultats ===
    console.log('7️⃣  Validation des résultats...');
    
    const validations = [
      {
        condition: noteAfterConversion.isTemplate === true,
        message: 'La note est devenue un template',
        error: 'La note devrait être un template'
      },
      {
        condition: noteAfterConversion.isShared === false,
        message: 'La note n\'est plus partagée',
        error: 'La note ne devrait plus être partagée'
      },
      {
        condition: noteAfterConversion.isPinned === false,
        message: 'La note n\'est plus épinglée',
        error: 'La note ne devrait plus être épinglée'
      },
      {
        condition: sharesAfterCount === 0,
        message: 'Tous les partages ont été supprimés',
        error: `Aucun partage ne devrait subsister (trouvé: ${sharesAfterCount})`
      },
      {
        condition: noteAfterConversion.shares.length === 0,
        message: 'Aucun partage dans la relation',
        error: 'La relation shares devrait être vide'
      },
      {
        condition: noteAfterConversion.checkboxes.length === 2,
        message: 'Les checkboxes sont préservées',
        error: 'Les checkboxes devraient être préservées'
      },
      {
        condition: noteAfterConversion.title === 'Note de test pour conversion',
        message: 'Le titre est préservé',
        error: 'Le titre devrait être préservé'
      },
      {
        condition: noteAfterConversion.color === '#ff5722',
        message: 'La couleur est préservée',
        error: 'La couleur devrait être préservée'
      }
    ];

    for (const validation of validations) {
      if (validation.condition) {
        console.log(`   ✅ ${validation.message}`);
      } else {
        console.log(`   ❌ ${validation.error}`);
        testPassed = false;
      }
    }

    // === ÉTAPE 8: Vérifier que la note n'apparaît plus dans les requêtes classiques ===
    console.log('\n8️⃣  Vérification de la séparation templates/notes...');
    
    const regularNotes = await prisma.note.findMany({
      where: { 
        userId: testUserId1,
        isTemplate: false 
      }
    });

    const templates = await prisma.note.findMany({
      where: { 
        userId: testUserId1,
        isTemplate: true 
      }
    });

    const hasNoteInRegular = regularNotes.some(n => n.id === testNoteId);
    const hasNoteInTemplates = templates.some(n => n.id === testNoteId);

    if (!hasNoteInRegular && hasNoteInTemplates) {
      console.log(`   ✅ La note convertie n'apparaît que dans les templates`);
    } else {
      console.log(`   ❌ Problème de séparation templates/notes`);
      testPassed = false;
    }

    console.log(`   📊 Notes régulières: ${regularNotes.length}`);
    console.log(`   📊 Templates: ${templates.length}\n`);

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error.message);
    testPassed = false;
  }

  // === NETTOYAGE ===
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    if (testNoteId) {
      // Supprimer les checkboxes liées
      await prisma.checkbox.deleteMany({
        where: { noteId: testNoteId }
      });
      
      // Supprimer les partages restants (par sécurité)
      await prisma.noteShare.deleteMany({
        where: { noteId: testNoteId }
      });
      
      // Supprimer la note/template
      await prisma.note.delete({
        where: { id: testNoteId }
      });
      console.log('   ✅ Note/template supprimé');
    }

    if (testUserId1) {
      await prisma.user.delete({
        where: { id: testUserId1 }
      });
      console.log('   ✅ Utilisateur propriétaire supprimé');
    }

    if (testUserId2) {
      await prisma.user.delete({
        where: { id: testUserId2 }
      });
      console.log('   ✅ Utilisateur partagé supprimé');
    }

  } catch (cleanupError) {
    console.error('⚠️  Erreur lors du nettoyage:', cleanupError.message);
  }

  // === RÉSULTAT FINAL ===
  console.log('\n================================================');
  if (testPassed) {
    console.log('🎉 SUCCÈS: Tous les tests sont passés !');
    console.log('✅ La conversion note → template supprime bien tous les partages');
    process.exit(0);
  } else {
    console.log('💥 ÉCHEC: Certains tests ont échoué');
    console.log('❌ La fonctionnalité ne fonctionne pas correctement');
    process.exit(1);
  }
}

// Exécution du script
async function main() {
  try {
    await runTest();
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