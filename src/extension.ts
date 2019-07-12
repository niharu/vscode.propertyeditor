import * as vscode from 'vscode';
import * as cowsay from 'cowsay';

export function activate(context: vscode.ExtensionContext) {
	// register a content provider for the cowsay-scheme
	const myScheme = 'cowsay';
	const myProvider = new class implements vscode.TextDocumentContentProvider {

		// emitter and its event
		onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
		onDidChange = this.onDidChangeEmitter.event;

		provideTextDocumentContent(uri: vscode.Uri): string {
			// simply invoke cowsay, use uri-path as text
			const editor = vscode.window.activeTextEditor;
			if (editor === undefined || editor === null) {
				return "";
			}
			// const selection = editor.selection;
			const text = editor.document.getText();
			return unescapeUnicode(text);
		}
	};

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

	// register a command that opens a cowsay-document
	context.subscriptions.push(vscode.commands.registerCommand('cowsay.say', async () => {
		let what = await vscode.window.showInputBox({ placeHolder: 'cowsay...' });
		if (what) {
			let uri = vscode.Uri.parse('cowsay:' + what);
			let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
			await vscode.window.showTextDocument(doc, { preview: false });
		}
	}));

	// register a command that updates the current cowsay
	context.subscriptions.push(vscode.commands.registerCommand('cowsay.backwards', async () => {
		if (!vscode.window.activeTextEditor) {
			return; // no editor
		}
		let { document } = vscode.window.activeTextEditor;
		if (document.uri.scheme !== myScheme) {
			return; // not my scheme
		}
		// get path-components, reverse it, and create a new uri
		let say = document.uri.path;
		let newSay = say.split('').reverse().join('');
		let newUri = document.uri.with({ path: newSay });
		await vscode.window.showTextDocument(newUri, { preview: false });
	}));



	const unescapeUnicodeCommand = vscode.commands.registerCommand('extension.unescapeUnicode', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined || editor === null) {
			return;
		}
		const selection = editor.selection;
		const text = editor.document.getText(selection);
		const ascii = unescapeUnicode(text);
		console.log(ascii);
	});

	const escapeUnicodeCommand = vscode.commands.registerCommand('extension.escapeUnicode', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined || editor === null) {
			return;
		}
		const selection = editor.selection;
		const text = editor.document.getText(selection);
		const ascii = escapeUnicode(text);
		console.log(ascii);
	});

	context.subscriptions.push(escapeUnicodeCommand);
	context.subscriptions.push(unescapeUnicodeCommand);
}

export function deactivate() { }

function unescapeUnicode(input: string): string {
	if (input === undefined || input === null) {
		return input;
	}
	return input.replace(/(\\u[0-9A-Fa-f]{4})/g, str => String.fromCodePoint(Number.parseInt(str.slice(2), 16)));
}

function escapeUnicode(input: string): string {
	if (input === undefined || input === null) {
		return input;
	}
	return input.split('').map(ch => toCodePoint(ch) <= 0x7f ? ch : '\\u' + ('0000' + toCodePoint(ch).toString(16)).slice(-4)).join('');
}

function toCodePoint(input: string): number {
	const result = input.codePointAt(0);
	if (result === undefined || result === null) {
		throw new Error();
	} else {
		return result;
	}
}