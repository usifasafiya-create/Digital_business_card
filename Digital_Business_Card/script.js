const STORAGE_KEY = "vision-tech-people";

const tableBody = document.getElementById("peopleTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const profileDialog = document.getElementById("profileDialog");
const cardDialog = document.getElementById("cardDialog");
const profileForm = document.getElementById("profileForm");
const liveMessage = document.getElementById("liveMessage");
let people = loadPeople();
let activeCard = null;

function loadPeople() {
    try {
        const savedPeople = localStorage.getItem(STORAGE_KEY);
        const parsedPeople = savedPeople ? JSON.parse(savedPeople) : [];
        return Array.isArray(parsedPeople) ? parsedPeople : [];
    } catch (error) {
        showMessage("Saved profiles could not be read. Check your browser storage settings.");
        return [];
    }
}

function savePeople() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
        return true;
    } catch (error) {
        showMessage("Your changes could not be saved. Check your browser storage settings and try again.");
        return false;
    }
}

function showMessage(message) {
    liveMessage.textContent = message;
}

function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

function createCell(className, text) {
    const cell = document.createElement("td");
    if (className) {
        cell.className = className;
    }
    cell.textContent = text || "—";
    return cell;
}

function addContactLink(cell, value, type) {
    if (!value) {
        cell.textContent = "—";
        return;
    }

    const link = document.createElement("a");
    link.className = "contact-link";
    link.textContent = value;
    if (type === "email") {
        link.href = "mailto:" + value;
    } else {
        link.href = "tel:" + value;
    }
    cell.replaceChildren(link);
}

function safeWebsite(value) {
    if (!value) {
        return null;
    }

    try {
        const url = new URL(value.match(/^https?:\/\//i) ? value : "https://" + value);
        return url.protocol === "http:" || url.protocol === "https:" ? url : null;
    } catch (error) {
        return null;
    }
}

function makePersonCell(person) {
    const cell = document.createElement("td");
    const personInfo = document.createElement("div");
    personInfo.className = "person-info";

    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = initials(person.name);

    const identity = document.createElement("span");
    identity.className = "person-identity";
    const name = document.createElement("strong");
    name.textContent = person.name;
    const email = document.createElement("small");
    email.textContent = person.email || "No email provided";

    identity.append(name, email);
    personInfo.append(avatar, identity);
    cell.append(personInfo);
    return cell;
}

function makeWebsiteCell(person) {
    const cell = document.createElement("td");
    const url = safeWebsite(person.website);
    if (!url) {
        cell.textContent = "—";
        return cell;
    }

    const link = document.createElement("a");
    link.className = "website-link";
    link.href = url.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = person.website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    link.setAttribute("aria-label", "Visit " + person.website + " (opens in a new tab)");
    cell.append(link);
    return cell;
}

function makeActionCell(person) {
    const cell = document.createElement("td");
    cell.className = "actions-cell";

    const viewButton = document.createElement("button");
    viewButton.className = "row-action";
    viewButton.type = "button";
    viewButton.textContent = "View card";
    viewButton.setAttribute("aria-label", "View business card for " + person.name);
    viewButton.addEventListener("click", () => openCard(person));

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-action";
    deleteButton.type = "button";
    deleteButton.textContent = "Remove";
    deleteButton.setAttribute("aria-label", "Remove " + person.name);
    deleteButton.addEventListener("click", () => removePerson(person.id));

    cell.append(viewButton, deleteButton);
    return cell;
}

function renderPeople() {
    const query = searchInput.value.trim().toLowerCase();
    const filteredPeople = people.filter((person) =>
        [person.name, person.job, person.company, person.phone, person.email, person.website]
            .some((value) => (value || "").toLowerCase().includes(query))
    );

    tableBody.replaceChildren();
    filteredPeople.forEach((person) => {
        const row = document.createElement("tr");
        row.append(
            makePersonCell(person),
            createCell("role-cell", person.job),
            createCell("company-cell", person.company),
            makeContactCell(person),
            makeWebsiteCell(person),
            makeActionCell(person)
        );
        tableBody.append(row);
    });

    const companyNames = new Set(people.map((person) => (person.company || "").trim().toLowerCase()).filter(Boolean));
    const completeCount = people.filter((person) => person.job && person.company && person.phone && person.email && person.website).length;
    document.getElementById("totalPeople").textContent = people.length;
    document.getElementById("totalCompanies").textContent = companyNames.size;
    document.getElementById("completeProfiles").textContent = people.length
        ? Math.round((completeCount / people.length) * 100) + "%"
        : "0%";
    document.getElementById("peopleCount").textContent = people.length;

    const hasPeople = people.length > 0;
    emptyState.hidden = filteredPeople.length > 0;
    document.querySelector(".table-wrap table").hidden = !hasPeople;
    document.querySelector(".storage-note").hidden = !hasPeople;

    if (!hasPeople) {
        document.getElementById("emptyTitle").textContent = "Your directory is ready";
        document.getElementById("emptyMessage").textContent = "Add your first person to see their business card details here.";
        document.getElementById("emptyAddBtn").hidden = false;
    } else if (filteredPeople.length === 0) {
        document.getElementById("emptyTitle").textContent = "No people found";
        document.getElementById("emptyMessage").textContent = "Try another name, role, company, or contact detail.";
        document.getElementById("emptyAddBtn").hidden = true;
    }
}

function makeContactCell(person) {
    const cell = document.createElement("td");
    cell.className = "contact-cell";
    if (person.email) {
        addContactLink(cell, person.email, "email");
    } else if (person.phone) {
        addContactLink(cell, person.phone, "phone");
    } else {
        cell.textContent = "—";
    }
    return cell;
}

function openCard(person) {
    activeCard = person;
    document.getElementById("cardMonogram").textContent = initials(person.name);
    document.getElementById("cardName").textContent = person.name;
    document.getElementById("cardJob").textContent = person.job || "Professional";
    document.getElementById("cardCompany").textContent = person.company || "";
    document.getElementById("cardPhone").textContent = person.phone || "";
    document.getElementById("cardEmail").textContent = person.email || "";
    document.getElementById("cardWebsite").textContent = person.website || "";
    document.getElementById("downloadError").textContent = "";
    cardDialog.showModal();
}

function removePerson(personId) {
    const person = people.find((item) => item.id === personId);
    if (!person) {
        return;
    }

    const previousPeople = people;
    people = people.filter((item) => item.id !== personId);
    if (!savePeople()) {
        people = previousPeople;
        return;
    }

    renderPeople();
    showMessage(person.name + " was removed from the directory.");
}

document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
}).format(new Date());

document.getElementById("addProfileBtn").addEventListener("click", () => {
    document.getElementById("formError").textContent = "";
    profileDialog.showModal();
    document.getElementById("name").focus();
});

document.getElementById("emptyAddBtn").addEventListener("click", () => {
    document.getElementById("addProfileBtn").click();
});

document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.close).close());
});

profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(profileForm);
    const person = {
        id: window.crypto && window.crypto.randomUUID
            ? window.crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: formData.get("name").trim(),
        job: formData.get("job").trim(),
        company: formData.get("company").trim(),
        phone: formData.get("phone").trim(),
        email: formData.get("email").trim(),
        website: formData.get("website").trim()
    };

    people.unshift(person);
    if (!savePeople()) {
        people.shift();
        return;
    }

    profileForm.reset();
    profileDialog.close();
    searchInput.value = "";
    renderPeople();
    showMessage(person.name + " was added to the directory.");
});

searchInput.addEventListener("input", renderPeople);

document.getElementById("downloadBtn").addEventListener("click", async () => {
    const downloadError = document.getElementById("downloadError");
    const downloadButton = document.getElementById("downloadBtn");
    downloadError.textContent = "";

    if (typeof html2canvas !== "function") {
        downloadError.textContent = "The card download service is unavailable. Check your internet connection and try again.";
        return;
    }

    downloadButton.disabled = true;
    downloadButton.textContent = "Preparing card...";
    try {
        const canvas = await html2canvas(document.getElementById("businessCard"), {
            backgroundColor: null,
            scale: 2
        });
        const link = document.createElement("a");
        const safeName = activeCard.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
        link.download = (safeName || "business-card") + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (error) {
        downloadError.textContent = "The card could not be downloaded. Please try again.";
    } finally {
        downloadButton.disabled = false;
        downloadButton.textContent = "Download card";
    }
});

document.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    const isTyping = activeElement.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);
    if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput.focus();
    }
});

renderPeople();
