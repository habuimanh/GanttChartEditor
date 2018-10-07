
export class GroupButton {
    private _groupButton: HTMLDivElement;

    constructor(buttons?: Button[], className?: string) {
        this._groupButton = document.createElement("div");
        this._groupButton.className = "btn-group btn-group-sm " + (className ? className : "");
        this._groupButton.setAttribute("role", "group");
        buttons && buttons.forEach(button => {
            this.addButton(button);
        }) 
    }

    getElement() {
        return this._groupButton;
    }

    addButton(button: Button) {
        this._groupButton.appendChild(button.getElement());
    }

    
}

export class Button {
    private _button: HTMLButtonElement;

    constructor(text: string, id: string, onClick?: (e: MouseEvent) => void) {
        this._button = document.createElement("button");
        this._button.type = "button";
        this._button.className = "btn btn-default";
        this._button.textContent = text;
        this._button.id = id;
        if (onClick) {
            this._button.onclick = onClick;
        }
    }

    getElement() {
        return this._button;
    }
}