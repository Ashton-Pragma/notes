export default class NotesEdit extends HTMLElement {
    #submitHandler = this.#submit.bind(this);
    #messageHandler = this.#message.bind(this);
    #form;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    async connectedCallback() {
        this.shadowRoot.innerHTML = await fetch(import.meta.url.replace(".js", ".html")).then(response => response.text());
        await this.#load();
    }

    async disconnectedCallback() {
        this.#form = null;
        this.#form.removeEventListener("submit", this.#submitHandler);
        this.#submitHandler = null;
        window.removeEventListener("note-edit", this.#messageHandler);
        this.#messageHandler = null;
    }

    async #load() {
        requestAnimationFrame(async () => {
            this.#form = this.shadowRoot.querySelector("form");
            this.#form.addEventListener("submit", this.#submitHandler);
            window.addEventListener("note-edit", this.#messageHandler);
        });
    }

    async #submit(event) {
        event.preventDefault();
        const title = this.#form.elements.title.value;
        const text = this.#form.elements.text.value;
        if (title === "") {
            alert("Please enter a title");
            return;
        }
        this.dispatchEvent(new CustomEvent("notes-message", {detail: {intent: "add", title, text}, bubbles: true}));
    }

    async #message(event) {
        this.#form.elements.title.value = event.detail.data.title;
        this.#form.elements.text.value = event.detail.data.text;
    }
}

customElements.define('notes-edit', NotesEdit);