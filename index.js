import "./components/notes-list/notes-list.js";
import "./components/notes-edit/notes-edit.js";

class ViewModel {
    #notesMessageHandler = this.#notesMessage.bind(this);
    #worker = new Worker("worker.js");
    #methodEventMap = Object.freeze({
        get: "note-edit",
        getAll: "note-list"
    });

    constructor(instance) {
        this.instance = instance;
        instance.addEventListener("notes-message", this.#notesMessageHandler.bind(this));

        this.#worker.onmessage = event => {
            const eventName = this.#methodEventMap[event.data.method];
            this.instance.dispatchEvent(new CustomEvent(eventName, {
                detail: {
                    intent: event.data.method,
                    data: event.data.result
                }
            }));
        }
    }

    dispose() {
        this.instance.removeEventListener("new-note", this.#notesMessageHandler);
        this.#notesMessageHandler = null;
    }

    async loadExisting() {
        requestIdleCallback(async () => {
            const result = await this.#worker.postMessage({
                method: 'getAll',
                params: ["notes", "notesStore", 1]
            });
        });
    }

    async #newNote(event) {
        this.#worker.postMessage({
            method: "put",
            params: ["notes", "notesStore", 1, event.detail]
        });

        this.instance.dispatchEvent(new CustomEvent("note-list", {
            detail: {
                intent: "add",
                data: event.detail
            }
        }));
    }

    async #edit(event) {
        const result = await this.#worker.postMessage({
            method: 'get',
            params: ["notes", "notesStore", 1, event.detail.key]
        });
    }

    async #delete(event) {
        this.#worker.postMessage({
            method: "delete",
            params: ["notes", "notesStore", 1, event.detail.key]
        });
    }

    async #notesMessage(event) {
        switch (event.detail.intent) {
            case "add":
                await this.#newNote(event);
                break;
            case "edit":
                await this.#edit(event);
                break;
            case "delete":
                await this.#delete(event);
                break;
            default:
                throw new Error(`Unsupported intent: ${event.detail.intent}`);
        }
    }
}

window.viewModel = new ViewModel(window);
window.viewModel.loadExisting();