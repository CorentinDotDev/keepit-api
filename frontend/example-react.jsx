/**
 * Exemple d'intégration React avec l'API Notes
 * Ce composant montre comment utiliser l'API dans une application React
 */

import React, { useState, useEffect } from 'react';

// Importer le client API (ajustez le chemin selon votre structure)
import { NotesAPIClient, APIError } from './api-client.js';

const NotesApp = () => {
  const [client] = useState(() => new NotesAPIClient());
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Formulaires
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: '#ffffff' });

  // Authentification
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await client.login(loginForm.email, loginForm.password);
      setUser({ email: loginForm.email, token: result.token });
      setLoginForm({ email: '', password: '' });
      
      // Charger les notes après connexion
      await loadNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    client.logout();
    setUser(null);
    setNotes([]);
  };

  // Gestion des notes
  const loadNotes = async () => {
    try {
      const notesData = await client.getNotes();
      setNotes(notesData);
    } catch (err) {
      setError(`Erreur chargement notes: ${err.message}`);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newNote = await client.createNote({
        title: noteForm.title,
        content: noteForm.content,
        color: noteForm.color,
        isPinned: false,
        checkboxes: []
      });

      setNotes([...notes, newNote]);
      setNoteForm({ title: '', content: '', color: '#ffffff' });
    } catch (err) {
      setError(`Erreur création note: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await client.deleteNote(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      setError(`Erreur suppression: ${err.message}`);
    }
  };

  const handleTogglePin = async (noteId, currentPinned) => {
    try {
      const updatedNote = await client.updateNote(noteId, {
        isPinned: !currentPinned
      });
      
      setNotes(notes.map(note => 
        note.id === noteId ? updatedNote : note
      ));
    } catch (err) {
      setError(`Erreur modification: ${err.message}`);
    }
  };

  // Charger les notes au montage si l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  // Interface de connexion
  if (!user) {
    return (
      <div className="auth-container">
        <h1>Notes App - Connexion</h1>
        
        {error && (
          <div className="error" style={{color: 'red', margin: '10px 0'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{maxWidth: '300px', margin: '0 auto'}}>
          <div style={{marginBottom: '10px'}}>
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              required
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          
          <div style={{marginBottom: '10px'}}>
            <input
              type="password"
              placeholder="Mot de passe (min 6 caractères)"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              required
              minLength={6}
              style={{width: '100%', padding: '8px'}}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none'}}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{textAlign: 'center', marginTop: '20px'}}>
          Pas de compte ? Utilisez la même adresse email, elle sera créée automatiquement.
        </p>
      </div>
    );
  }

  // Interface principale
  return (
    <div className="notes-app">
      <header style={{padding: '20px', borderBottom: '1px solid #ddd'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>Notes App</h1>
          <div>
            <span style={{marginRight: '10px'}}>Connecté: {user.email}</span>
            <button onClick={handleLogout} style={{padding: '5px 10px'}}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error" style={{color: 'red', margin: '10px', padding: '10px', backgroundColor: '#ffe6e6'}}>
          {error}
          <button onClick={() => setError(null)} style={{float: 'right'}}>×</button>
        </div>
      )}

      <div style={{display: 'flex', padding: '20px', gap: '20px'}}>
        {/* Formulaire de création */}
        <div style={{flex: 1, maxWidth: '400px'}}>
          <h2>Créer une note</h2>
          <form onSubmit={handleCreateNote}>
            <div style={{marginBottom: '10px'}}>
              <input
                type="text"
                placeholder="Titre de la note (max 200 caractères)"
                value={noteForm.title}
                onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                required
                maxLength={200}
                style={{width: '100%', padding: '8px'}}
              />
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <textarea
                placeholder="Contenu de la note (max 10000 caractères)"
                value={noteForm.content}
                onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                required
                maxLength={10000}
                rows={5}
                style={{width: '100%', padding: '8px', resize: 'vertical'}}
              />
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <label>Couleur: </label>
              <input
                type="color"
                value={noteForm.color}
                onChange={(e) => setNoteForm({...noteForm, color: e.target.value})}
                style={{marginLeft: '10px'}}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none'}}
            >
              {loading ? 'Création...' : 'Créer la note'}
            </button>
          </form>
        </div>

        {/* Liste des notes */}
        <div style={{flex: 2}}>
          <h2>Mes notes ({notes.length})</h2>
          
          {notes.length === 0 ? (
            <p style={{textAlign: 'center', color: '#666', fontStyle: 'italic'}}>
              Aucune note. Créez votre première note !
            </p>
          ) : (
            <div style={{display: 'grid', gap: '15px'}}>
              {notes
                .sort((a, b) => b.isPinned - a.isPinned) // Notes épinglées en premier
                .map(note => (
                <div 
                  key={note.id} 
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: note.color || '#ffffff',
                    position: 'relative'
                  }}
                >
                  {note.isPinned && (
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      backgroundColor: '#ffc107',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      📌
                    </div>
                  )}
                  
                  <h3 style={{margin: '0 0 10px 0', fontSize: '18px'}}>
                    {note.title}
                  </h3>
                  
                  <p style={{margin: '0 0 10px 0', whiteSpace: 'pre-wrap'}}>
                    {note.content}
                  </p>
                  
                  {note.checkboxes && note.checkboxes.length > 0 && (
                    <div style={{marginBottom: '10px'}}>
                      <strong>Tâches:</strong>
                      <ul style={{margin: '5px 0', paddingLeft: '20px'}}>
                        {note.checkboxes.map(checkbox => (
                          <li key={checkbox.id} style={{listStyle: 'none'}}>
                            <input 
                              type="checkbox" 
                              checked={checkbox.checked}
                              onChange={() => handleToggleCheckbox(checkbox.id, checkbox.checked)}
                              style={{marginRight: '5px'}}
                            />
                            <span style={{textDecoration: checkbox.checked ? 'line-through' : 'none'}}>
                              {checkbox.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <span>
                      Créé: {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button
                        onClick={() => handleTogglePin(note.id, note.isPinned)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: note.isPinned ? '#ffc107' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}
                      >
                        {note.isPinned ? 'Détacher' : 'Épingler'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer style={{padding: '20px', borderTop: '1px solid #ddd', marginTop: '40px', textAlign: 'center', color: '#666'}}>
        Notes API - Exemple React | Documentation: <a href="http://localhost:3000/api-docs" target="_blank">Swagger UI</a>
      </footer>
    </div>
  );

  // Fonction pour gérer les checkboxes (manquante dans le code ci-dessus)
  async function handleToggleCheckbox(checkboxId, currentChecked) {
    try {
      await client.updateCheckbox(checkboxId, !currentChecked);
      await loadNotes(); // Recharger les notes pour voir les changements
    } catch (err) {
      setError(`Erreur checkbox: ${err.message}`);
    }
  }
};

export default NotesApp;