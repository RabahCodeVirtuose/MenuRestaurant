window.addEventListener('DOMContentLoaded', () => {
  let total = 0;
  const totalSpan = document.getElementById("total");
  const montantInput = document.getElementById("montant-client");
  const monnaieSpan = document.getElementById("monnaie");
  const select = document.getElementById("categories");
  const productList = document.getElementById("product-list");

  let listeCommande = document.getElementById("commande-produits");
  if (!listeCommande) {
    listeCommande = document.createElement("ul");
    listeCommande.id = "commande-produits";
    document.getElementById("commande-summary").insertBefore(listeCommande, montantInput);
  }

  function updateRecap() {
    totalSpan.textContent = total.toFixed(2) + " €";
    const montantDonne = parseFloat(montantInput.value);
    if (!isNaN(montantDonne)) {
      const monnaie = montantDonne - total;
      monnaieSpan.textContent = monnaie >= 0 ? monnaie.toFixed(2) + " €" : "Montant insuffisant";
    } else {
      monnaieSpan.textContent = "0.00 €";
    }
  }
function ajouterProduitDansCommande(nom, prix, details = "") {
  const li = document.createElement("li");
  li.classList.add("commande-carte");

  // === HEADER : nom + prix ===
  const divHeader = document.createElement("div");
  divHeader.classList.add("commande-header");

  const nomSpan = document.createElement("span");
  nomSpan.classList.add("commande-nom");
  nomSpan.textContent = nom;

  const prixSpan = document.createElement("span");
  prixSpan.classList.add("commande-prix");
  prixSpan.textContent = prix.toFixed(2) + " €";

  divHeader.appendChild(nomSpan);
  divHeader.appendChild(prixSpan);
  li.appendChild(divHeader);

  // === DETAILS ===
  if (details) {
    const ulDetails = document.createElement("ul");
    ulDetails.classList.add("commande-details");

    details.split(" | ").forEach(section => {
      const liDetail = document.createElement("li");

      const [label, valeurs] = section.split(":");
      const titre = document.createElement("strong");
      titre.textContent = label.trim() + " :";
      liDetail.appendChild(titre);

      // Pour chaque élément séparé par des virgules
      valeurs.split(",").forEach(val => {
        const ligne = document.createElement("div");
        ligne.textContent = val.trim();
        liDetail.appendChild(ligne);
      });

      ulDetails.appendChild(liDetail);
    });

    li.appendChild(ulDetails);
  }

  // === FOOTER : bouton supprimer ===
  const divFooter = document.createElement("div");
  divFooter.classList.add("commande-footer");

  const btnSupprimer = document.createElement("button");
  btnSupprimer.textContent = "🗑️";
  btnSupprimer.classList.add("btn-supprimer");
  btnSupprimer.addEventListener("click", () => {
    listeCommande.removeChild(li);
    total -= prix;
    updateRecap();
  });

  divFooter.appendChild(btnSupprimer);
  li.appendChild(divFooter);

  listeCommande.appendChild(li);
}
  async function loadXML(url) {
    const response = await fetch(url);
    const text = await response.text();
    return (new window.DOMParser()).parseFromString(text, "text/xml");
  }

  function createCheckboxes(options, max = Infinity) {
    const container = document.createElement("div");
    let count = 0;
    options.forEach(opt => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = opt;
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (++count > max) {
            checkbox.checked = false;
            count--;
            alert(`Tu peux choisir maximum ${max} éléments`);
          }
        } else {
          count--;
        }
      });
      label.appendChild(checkbox);
      label.append(" " + opt);
      container.appendChild(label);
    });
    return container;
  }

  function createRadio(options) {
    const container = document.createElement("div");
    options.forEach(opt => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "boisson";
      radio.value = opt;
      label.appendChild(radio);
      label.append(" " + opt);
      container.appendChild(label);
    });
    return container;
  }


async function ouvrirPopupAvecOptions(type, nom, prixBase) {
  try {
    // Supprimer les anciennes popups (sécurité)
    document.querySelectorAll(".popup-overlay").forEach(el => el.remove());

    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";

    const popup = document.createElement("div");
    popup.className = "popup";
    popup.innerHTML = `<h3>Personnalise ton menu</h3><hr>`;

    let prixTotal = prixBase; // prix du produit + suppléments
    let details = [];

    // Chargement XML
    const [xmlSauces, xmlSupps, xmlCrudites, xmlBoissons] = await Promise.all([
      loadXML("sauces.xml"),
      loadXML("supplements.xml"),
      type === "A" ? loadXML("crudites.xml") : Promise.resolve(null),
      type === "A" ? loadXML("boissons.xml") : Promise.resolve(null)
    ]);

    // === SAUCES ===
    const sauces = Array.from(xmlSauces.getElementsByTagName("produit")).map(p => p.textContent);
    popup.appendChild(document.createTextNode("Sauces (2 max):"));
    const sauceSection = createCheckboxes(sauces, 2);
    popup.appendChild(sauceSection);

    // === CRUDITÉS ===
    let cruditeSection = null;
    if (xmlCrudites) {
      const crudites = Array.from(xmlCrudites.getElementsByTagName("produit")).map(p => p.textContent);
      popup.appendChild(document.createTextNode("Crudités:"));
      cruditeSection = createCheckboxes(crudites);
      popup.appendChild(cruditeSection);
    }

    // === BOISSONS ===
    let boissonSection = null;
    if (xmlBoissons) {
      const boissons = Array.from(xmlBoissons.getElementsByTagName("produit")).map(p => p.textContent);
      popup.appendChild(document.createTextNode("Boisson:"));
      boissonSection = createRadio(boissons);
      popup.appendChild(boissonSection);
    }

    // === SUPPLÉMENTS ===
    const supplements = Array.from(xmlSupps.getElementsByTagName("produit")).map(p => ({
      nom: p.getElementsByTagName("nom")[0].textContent,
      prix: parseFloat(p.getElementsByTagName("prix")[0].textContent)
    }));

    popup.appendChild(document.createTextNode("Suppléments (payants):"));
    const suppSection = document.createElement("div");
    supplements.forEach(supp => {
      const label = document.createElement("label");
      label.style.display = "block";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = supp.nom;
      checkbox.dataset.prix = supp.prix;
      label.appendChild(checkbox);
      label.append(` ${supp.nom} (+${supp.prix.toFixed(2)} €)`);
      suppSection.appendChild(label);
    });
    popup.appendChild(suppSection);

    // === BOUTON VALIDER ===
    const btn = document.createElement("button");
    btn.textContent = "Valider";
    btn.addEventListener("click", () => {
      try {
        let texteDetails = [];
        prixTotal = prixBase; // Réinitialise à chaque clic

        // Sauces
        const saucesChecked = Array.from(sauceSection.querySelectorAll("input:checked")).map(i => i.value);
        if (saucesChecked.length) texteDetails.push("Sauces: " + saucesChecked.join(", "));

        // Crudités
        if (cruditeSection) {
          const cruditesChecked = Array.from(cruditeSection.querySelectorAll("input:checked")).map(i => i.value);
          if (cruditesChecked.length) texteDetails.push("Crudités: " + cruditesChecked.join(", "));
        }

        // Boissons
        if (boissonSection) {
          const selectedBoisson = boissonSection.querySelector("input:checked");
          if (selectedBoisson) texteDetails.push("Boisson: " + selectedBoisson.value);
        }

        // Suppléments
        const suppsChecked = Array.from(suppSection.querySelectorAll("input:checked"));
        if (suppsChecked.length > 0) {
          const suppsTexte = [];
          suppsChecked.forEach(input => {
            const nomSupp = input.value;
            const prixSupp = parseFloat(input.dataset.prix);
            prixTotal += prixSupp;
            suppsTexte.push(`${nomSupp} (+${prixSupp.toFixed(2)} €)`);
          });
          texteDetails.push("Suppléments: " + suppsTexte.join(", "));
        }

        // Ajouter à la commande
        ajouterProduitDansCommande(nom, prixTotal, texteDetails.join(" | "));
        total += prixTotal; // total global (doit être défini dans ton script principal)
        updateRecap();
        overlay.remove();
      } catch (e) {
        alert("Erreur lors de la validation du menu.");
        console.error("Erreur dans bouton Valider :", e);
      }
    });

    popup.appendChild(document.createElement("hr"));
    popup.appendChild(btn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

  } catch (err) {
    alert("Erreur de chargement. Réessaie.");
    console.error("Erreur dans ouvrirPopupAvecOptions:", err);
  }
}

  // Chargement du menu principal
  fetch('Menu.xml')
    .then(response => response.text())
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(data => {
      const menu = data.getElementsByTagName("menu")[0];
      const categories = menu.getElementsByTagName("categorie");

      Array.from(categories).forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.getAttribute("nom");
        option.textContent = cat.getAttribute("nom");
        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        const selectedCat = Array.from(categories).find(c => c.getAttribute("nom") === select.value);
        const produits = selectedCat.getElementsByTagName("produit");
        productList.innerHTML = "";

        Array.from(produits).forEach(p => {
          const nom = p.getElementsByTagName("nom")[0]?.textContent || "Nom inconnu";
          const prix = parseFloat(p.getElementsByTagName("prix")[0]?.textContent || "0");
          const type = p.getAttribute("typePersonnalisation") || "C";

          const item = document.createElement("div");
          item.className = "produit-item";
          item.innerHTML = `
            <strong>${nom}</strong>
            <span>${prix.toFixed(2)} €</span>
            <button class="btn-ajouter">+</button>
          `;

          item.querySelector(".btn-ajouter").addEventListener("click", () => {
            if (type === "A" || type === "B") {
              ouvrirPopupAvecOptions(type, nom, prix);
            } else {
              total += prix;
              ajouterProduitDansCommande(nom, prix);
              updateRecap();
            }
          });

          productList.appendChild(item);
        });
      });

      if (categories.length > 0) {
        select.value = categories[0].getAttribute("nom");
        select.dispatchEvent(new Event("change"));
      }

      montantInput.addEventListener("input", updateRecap);
    });
});