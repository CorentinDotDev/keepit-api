/**
 * Client JavaScript pour l'API Notes
 * Utilisable dans le navigateur ou avec Node.js (avec fetch polyfill)
 */

class NotesAPIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.token = null;
  }

  // Méthode utilitaire pour les requêtes
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Ajouter le token d'authentification si disponible
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(data.error || 'Erreur API', response.status, data);
    }

    return data;
  }

  // === AUTHENTIFICATION ===

  /**
   * Inscription d'un nouvel utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe (min 6 caractères)
   */
  async register(email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return data;
  }

  /**
   * Connexion utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Stocker le token pour les requêtes suivantes
    this.token = data.token;
    return data;
  }

  /**
   * Définir manuellement le token d'authentification
   * @param {string} token - Token JWT
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Supprimer le token (déconnexion)
   */
  logout() {
    this.token = null;
  }

  // === GESTION DES NOTES ===

  /**
   * Récupérer toutes les notes de l'utilisateur
   */
  async getNotes() {
    return await this.request('/notes');
  }

  /**
   * Récupérer une note par son ID
   * @param {number} id - ID de la note
   */
  async getNote(id) {
    return await this.request(`/notes/${id}`);
  }

  /**
   * Créer une nouvelle note
   * @param {Object} noteData - Données de la note
   * @param {string} noteData.title - Titre (max 200 caractères)
   * @param {string} noteData.content - Contenu (max 10000 caractères)
   * @param {string} [noteData.color] - Couleur (format hex)
   * @param {boolean} [noteData.isPinned] - Note épinglée
   * @param {Array} [noteData.checkboxes] - Liste de checkboxes
   */
  async createNote(noteData) {
    return await this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  }

  /**
   * Mettre à jour une note
   * @param {number} id - ID de la note
   * @param {Object} updates - Données à modifier
   */
  async updateNote(id, updates) {
    return await this.request(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Supprimer une note
   * @param {number} id - ID de la note
   */
  async deleteNote(id) {
    return await this.request(`/notes/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Mettre à jour l'état d'une checkbox
   * @param {number} checkboxId - ID de la checkbox
   * @param {boolean} checked - Nouvel état
   */
  async updateCheckbox(checkboxId, checked) {
    return await this.request(`/notes/checkbox/${checkboxId}`, {
      method: 'PATCH',
      body: JSON.stringify({ checked })
    });
  }

  // === WEBHOOKS ===

  /**
   * Récupérer tous les webhooks de l'utilisateur
   */
  async getWebhooks() {
    return await this.request('/webhooks');
  }

  /**
   * Créer un nouveau webhook
   * @param {string} action - Action ('note_created', 'note_updated', 'note_deleted')
   * @param {string} url - URL du webhook (HTTPS recommandé)
   */
  async createWebhook(action, url) {
    return await this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ action, url })
    });
  }
}

/**
 * Classe d'erreur personnalisée pour l'API
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotesAPIClient, APIError };
}

// Exemple d'utilisation
if (typeof window !== 'undefined') {
  window.NotesAPIClient = NotesAPIClient;
  window.APIError = APIError;
}