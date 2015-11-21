import vscode = require('vscode');
import cp = require('child_process');

import { getRustfmtPath } from './rustPath';

function formatRustfmtCommand(fileName: string, writeMode: string): string {
	return getRustfmtPath() + ' --write-mode=' + writeMode + ' ' + fileName;
}

export class RustDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
	private writeMode: string = 'display';
	
	constructor() {
		this.writeMode = 'display';
	}
	
	public provideDocumentFormattingEdits(document: vscode.TextDocument, 
										  options: vscode.FormattingOptions, 
										  token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
		return document.save().then(() => {
			return this.performFormatFile(document, options, token, this.writeMode);
		});
	}
	
	private performFormatFile(document: vscode.TextDocument, 
							  options: vscode.FormattingOptions, 
							  token: vscode.CancellationToken,
							  writeMode: string) : Promise<vscode.TextEdit[]> {
		return new Promise(function (resolve, reject) {
			let fileName = document.fileName;
			let command = formatRustfmtCommand(fileName, writeMode);
			
			cp.exec(command, (err, stdout, stderr) => {
				try {
					if (err && (<any>err).code == 'ENOENT') {
						vscode.window.showInformationMessage('The "rustfmt" command is not available. Make sure it is installed.');
						return resolve(null);
					}
					if (err) return reject('Cannot format due to syntax errors');
					
					// Need this to remove label of rustfmt output
					let text = stdout.toString().split('\n').slice(2).join('\n');
					
					//TODO: implement parsing of rustfmt output with 'diff' writemode
					let lastLine = document.lineCount;
					let lastLineLastCol = document.lineAt(lastLine - 1).range.end.character;
					let range = new vscode.Range(0, 0, lastLine - 1, lastLineLastCol);
					return resolve([new vscode.TextEdit(range, text)]);
				} catch(e) {
					reject(e);
				}
			});
		});
	}
}