export default class NotesList extends HTMLElement {
    #noteListHandler = this.#message.bind(this);
    #clickHandler = this.#click.bind(this);
    #ul;
    #selectedElement;

    #actions = Object.freeze({
        add: this.#add.bind(this),
        getAll: this.#loadAll.bind(this)
    });

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        window.addEventListener("note-list", this.#noteListHandler.bind(this));
        this.shadowRoot.addEventListener("click", this.#clickHandler.bind(this));
    }

    async connectedCallback() {
        this.shadowRoot.innerHTML = await fetch(import.meta.url.replace(".js", ".html")).then(response => response.text());
        await this.#load();
    }

    async disconnectedCallback() {
        window.removeEventListener("note-list", this.#noteListHandler);
        this.#noteListHandler = null;
        this.#ul = null;
        this.shadowRoot.removeEventListener("click", this.#clickHandler);
        this.#clickHandler = null;
        this.#selectedElement = null;
    }

    async #load() {
        this.#ul = this.shadowRoot.querySelector("ul");
    }

    async #add(data) {
        const existingLi = this.#ul.querySelector(`li[key="${data.title}"]`);
        if (existingLi != null) {
            existingLi.innerHTML = `<h3>${data.title}</h3><p>${data.text}</p>`;
            return;
        }
        const li = this.#createLi(data);
        this.#ul.appendChild(li);
    }

    #createLi(data) {
        const li = document.createElement("li");
        li.setAttribute("key", data.title);
        li.innerHTML = `<h3>${data.title}</h3><p>${data.text}</p>`;
        return li;
    }

    async #loadAll(data) {
        const fragment = document.createDocumentFragment();
        for (const item of data) {
            const li = this.#createLi(item);
            fragment.appendChild(li);
        }
        this.#ul.appendChild(fragment);
    }

    async #message(event) {
        await this.#actions[event.detail.intent](event.detail.data);
    }

    async #click(event) {
        const target = event.target;

        if (target.dataset.action === "delete") {

            if (this.#selectedElement == null) {
                alert("Please select a note to delete");
                return;
            }

            this.dispatchEvent(new CustomEvent("notes-message", {
                detail: {
                    intent: "delete", key: this.#selectedElement.getAttribute("key")
                }, bubbles: true
            }));
            this.#ul.removeChild(this.#selectedElement);
            this.#selectedElement = null;
            return;
        }

        this.#selectedElement?.classList?.remove("selected");
        const element = await this.#findParentWithAttribute(target, "key");
        if (element == null) return;
        const key = element.getAttribute("key");
        if (key == null) return;
        this.dispatchEvent(new CustomEvent("notes-message", {detail: {intent: "edit", key}, bubbles: true}));
        this.#selectedElement = element;
        this.#selectedElement.classList.add("selected");
    }

    async #findParentWithAttribute(element, attribute) {
        if (element.hasAttribute(attribute)) {
            return element;
        }
        if (element.parentElement) {
            return this.#findParentWithAttribute(element.parentElement, attribute);
        }
        return null;
    }
}

customElements.define('notes-list', NotesList);