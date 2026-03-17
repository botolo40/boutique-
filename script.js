
        // 🔑 CONFIGURATION
        const COLLECTION_ID = '69b94662aa77b81da9f16d5d'; // Votre collection
        const API_KEY = '$2a$10$R54HsqVP06VAPvnEg8B1MeJgrLH0ZGQgfosoMjZCjCNDcoWQGPila'; // Votre clé API
        
        // 📁 GESTION DES BINS
        // Le premier bin (celui que vous avez déjà)
        let bins = [
            { id: '69b7fd00c3097a1dd52d4ef1', articles: [] }
        ];
        
        // Pour stocker tous les articles chargés
        let elements = [];
        
        // Constantes
        const height = 320;
        const LIMITE_TAILLE = 80000; // 80 Ko (sous la limite de 100 Ko)

        // Éléments DOM
        const boutonAjouter = document.getElementById('ajouter');
        const contenuDiv = document.getElementById('contenu');
        const ajoutForm = document.getElementById('ajout-form');
        const imageInput = document.getElementById('image-input');
        const titleInput = document.getElementById('title-input');
        const texteInput = document.getElementById('texte-input');
        const ajouterElement = document.getElementById('ajouter-element');
        const annuler = document.getElementById('annuler');

        // ===== FONCTION DE COMPRESSION D'IMAGE =====
        // Redimensionne et compresse l'image avant conversion en base64
        function compresserImage(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        // Dimensions maximales (600px de large max)
                        let width = img.width;
                        let height = img.height;
                        const maxWidth = 600;
                        
                        if (width > maxWidth) {
                            height = Math.floor((maxWidth / width) * height);
                            width = maxWidth;
                        }
                        
                        // Créer un canvas pour le redimensionnement
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convertir en JPEG avec qualité 0.6 (60%)
                        // Format: data:image/jpeg;base64,/9j/4AAQ...
                        const base64Compresse = canvas.toDataURL('image/jpeg', 0.6);
                        
                        // Afficher le gain de taille dans la console (optionnel)
                        console.log('Taille originale:', Math.round(e.target.result.length / 1024), 'Ko');
                        console.log('Taille compressée:', Math.round(base64Compresse.length / 1024), 'Ko');
                        
                        resolve(base64Compresse);
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
            });
        }

        // ===== FONCTIONS UTILITAIRES =====
        
        function formatDate(dateString) {
            if (!dateString) return 'date inconnue';
            try {
                const date = new Date(dateString);
                return date.toLocaleString();
            } catch (e) {
                return dateString;
            }
        }

        // Estimer la taille d'un objet en JSON
        function estimerTaille(obj) {
            return JSON.stringify(obj).length;
        }

        // ===== FONCTIONS API JSONBIN =====
        
        // Charger un bin spécifique
        async function chargerBin(binId) {
            try {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`);
                const data = await response.json();
                return (data.record && data.record.articles) ? data.record.articles : [];
            } catch (error) {
                console.error(`Erreur chargement bin ${binId}:`, error);
                return [];
            }
        }

        // Sauvegarder un bin spécifique
        async function sauvegarderBin(binId, articles) {
            try {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_KEY
                    },
                    body: JSON.stringify({ articles: articles })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                return true;
            } catch (error) {
                console.error('Erreur sauvegarde:', error);
                alert('Erreur lors de la sauvegarde : ' + error.message);
                return false;
            }
        }

        // Créer un nouveau bin dans la collection
        async function creerNouveauBin() {
            try {
                const response = await fetch('https://api.jsonbin.io/v3/b', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_KEY,
                        'X-Collection-Id': COLLECTION_ID,
                        'X-Bin-Name': `Produits_${new Date().toISOString().slice(0,10)}_${Date.now()}`
                    },
                    body: JSON.stringify({ articles: [] })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Nouveau bin créé:', data.metadata.id);
                    return data.metadata.id;
                }
                return null;
            } catch (error) {
                console.error('Erreur création bin:', error);
                return null;
            }
        }

        // ===== FONCTIONS PRINCIPALES =====
        
        // Charger tous les articles de tous les bins
        async function chargerTousLesArticles() {
            try {
                let tousLesArticles = [];
                
                // Charger chaque bin
                for (const bin of bins) {
                    const articles = await chargerBin(bin.id);
                    bin.articles = articles;
                    tousLesArticles = [...tousLesArticles, ...articles];
                }
                
                // Trier par date (récent en premier)
                tousLesArticles.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    return dateB - dateA;
                });
                
                elements = tousLesArticles;
                afficherElements();
            } catch (error) {
                console.error('Erreur chargement:', error);
                elements = [];
                afficherElements();
            }
        }

        // Afficher tous les éléments
        function afficherElements() {
            contenuDiv.innerHTML = '';
            elements.forEach((element, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item';
                const dateLisible = formatDate(element.date);
                
                itemDiv.innerHTML = `
                    <div class="big-text">${element.title}</div>
                    <div style="border-radius:20px; border:1px solid #D2B48C; background:#1e1e24; width:280px; height:500px; color:#ccc; text-align:center; position:relative;">
                        <br><br><br>
                        <img src="${element.image}" height="${element.height}" style="vertical-align:top; margin-right:10px;">
                        <p><strong>${element.texte}</strong></p>
                        <p><small>Publié le ${dateLisible}</small></p>
                        <p>Contactez la personne qui vend!</p>
                        <div id="btn-div">
                            <button class="btn"><i class="fas fa-phone" style="color:#D2B48C; font-size:25px;"></i></button>
                            <button class="btn"><i class="fas fa-share-alt" style="font-size:25px; color:#D2B48C;"></i></button>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button onclick="modifierElement(${index})"><i class="fas fa-edit"></i> Modifier</button>
                        <button onclick="supprimerElement(${index})"><i class="fas fa-trash"></i> Supprimer</button>
                    </div>
                    <div id="options-${index}" class="options" style="display:none; margin-top:10px;">
                        <button onclick="modifierTexte(${index})">Modifier le texte</button>
                        <button onclick="modifierImage(${index})">Modifier l'image</button>
                    </div>
                `;
                contenuDiv.appendChild(itemDiv);
            });
        }

        // ===== FONCTIONS D'ÉDITION =====
        
        window.modifierElement = function(index) {
            const options = document.getElementById(`options-${index}`);
            options.style.display = options.style.display === 'none' ? 'block' : 'none';
        };

        window.modifierTexte = async function(index) {
            const nouveauTexte = prompt('Nouveau texte :', elements[index].texte);
            if (nouveauTexte !== null) {
                elements[index].texte = nouveauTexte;
                await sauvegarderTousLesBins();
                afficherElements();
            }
        };

        window.modifierImage = async function(index) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const fichier = e.target.files[0];
                if (fichier) {
                    try {
                        // Compresser l'image avant de la sauvegarder
                        const imageCompressee = await compresserImage(fichier);
                        elements[index].image = imageCompressee;
                        await sauvegarderTousLesBins();
                        afficherElements();
                    } catch (error) {
                        alert('Erreur lors de la compression de l\'image');
                    }
                }
            };
            input.click();
        };

        window.supprimerElement = async function(index) {
            if (confirm('Supprimer cet élément ?')) {
                elements.splice(index, 1);
                await sauvegarderTousLesBins();
                afficherElements();
            }
        };

        // Sauvegarder tous les bins avec leurs articles respectifs
        async function sauvegarderTousLesBins() {
            // Réorganiser les articles par bin
            const articlesParBin = {};
            bins.forEach(bin => { articlesParBin[bin.id] = []; });
            
            // Répartir les articles dans leurs bins d'origine (basé sur un champ binId)
            // Pour simplifier, on va tout mettre dans le dernier bin pour cet exemple
            // Idéalement, chaque article devrait avoir un champ binId
            const dernierBin = bins[bins.length - 1];
            articlesParBin[dernierBin.id] = elements;
            
            // Sauvegarder chaque bin
            let succes = true;
            for (const bin of bins) {
                if (!await sauvegarderBin(bin.id, articlesParBin[bin.id])) {
                    succes = false;
                }
            }
            return succes;
        }

        // ===== GESTION DE L'AJOUT =====
        
        boutonAjouter.addEventListener('click', () => {
            ajoutForm.style.display = 'block';
        });

        annuler.addEventListener('click', () => {
            ajoutForm.style.display = 'none';
            imageInput.value = '';
            texteInput.value = '';
            titleInput.value = '';
        });

        ajouterElement.addEventListener('click', async () => {
            const fichier = imageInput.files[0];
            if (!fichier) {
                alert('Veuillez sélectionner une image.');
                return;
            }
            
            try {
                // 🔥 ÉTAPE IMPORTANTE : Compression de l'image avant tout !
                const imageCompressee = await compresserImage(fichier);
                
                const titre = titleInput.value.trim() || 'Sans titre';
                const texte = texteInput.value.trim() || '(sans description)';
                
                const nouvelElement = {
                    image: imageCompressee,  // Image compressée
                    title: titre,
                    texte: texte,
                    date: new Date().toISOString(),
                    height: height
                };
                
                // Trouver le bin actif (le dernier)
                let binActif = bins[bins.length - 1];
                
                // Estimer si le bin actif est trop plein
                const tailleBinActif = estimerTaille(binActif.articles);
                const tailleNouvelElement = estimerTaille(nouvelElement);
                
                console.log(`Taille bin actuel: ${tailleBinActif}, nouvel élément: ${tailleNouvelElement}`);
                
                // Si le bin est trop plein, créer un nouveau bin
                if (tailleBinActif + tailleNouvelElement > LIMITE_TAILLE) {
                    console.log('Création d\'un nouveau bin...');
                    const nouveauBinId = await creerNouveauBin();
                    if (nouveauBinId) {
                        bins.push({ id: nouveauBinId, articles: [] });
                        binActif = bins[bins.length - 1];
                    } else {
                        alert('Impossible de créer un nouveau bin. Publication annulée.');
                        return;
                    }
       
        }
                
                // Ajouter l'article au tableau global et au bin actif
                elements.push(nouvelElement);
                binActif.articles.push(nouvelElement);
                
                // Sauvegarder uniquement le bin actif
                if (await sauvegarderBin(binActif.id, binActif.articles)) {
                    afficherElements();
                    ajoutForm.style.display = 'none';
                    imageInput.value = '';
                    texteInput.value = '';
                    titleInput.value = '';
                } else {
                    elements.pop(); // Annuler
                    binActif.articles.pop();
                }
            } catch (error) {
                console.error('Erreur lors de la compression:', error);
                alert('Erreur lors du traitement de l\'image. Veuillez réessayer.');
            }
        });

        // Initialisation
        chargerTousLesArticles();
