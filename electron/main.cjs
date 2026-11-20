const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const indexFile = pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString();
const fichierBase = path.join(app.getPath('userData'), 'acsf-db.bin');
const fichierWasm = path.join(__dirname, '..', 'dist', 'sql-wasm-browser.wasm');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 640,
    title: 'ACSF Desktop — ACSF-AFRIQUE',
    backgroundColor: '#FFFCE8',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  win.setMenuBarVisibility(false);
  win.loadURL(indexFile);
}

ipcMain.handle('acsf:disque:lire', async () => {
  try {
    const binaire = fs.readFileSync(fichierBase);
    return binaire.toString('base64');
  } catch {
    return null;
  }
});

ipcMain.handle('acsf:disque:ecrire', async (event, donnees) => {
  if (!donnees) return;
  const octets = donnees instanceof Uint8Array ? donnees : new Uint8Array(donnees);
  fs.writeFileSync(fichierBase, Buffer.from(octets));
});

ipcMain.handle('acsf:disque:sauvegarder', async () => {
  try {
    if (fs.existsSync(fichierBase)) {
      const backup = fichierBase + '.bak';
      fs.copyFileSync(fichierBase, backup);
    }
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('acsf:disque:lireWasm', async () => {
  try {
    return fs.readFileSync(fichierWasm).toString('base64');
  } catch {
    return null;
  }
});

// Les exports utilisent un <a download> côté renderer. Sans handler, Electron enregistre
// directement dans Téléchargements. On personnalise la boîte « Enregistrer sous » pour
// laisser l'utilisateur choisir le dossier et le nom du classeur.
app.whenReady().then(() => {
  session.defaultSession.on('will-download', (_event, item) => {
    const nomFichier = item.getFilename();
    if (!nomFichier.toLowerCase().endsWith('.xlsx')) return;
    item.setSaveDialogOptions({
      title: 'Enregistrer l’export ACSF',
      defaultPath: path.join(app.getPath('downloads'), nomFichier),
      filters: [{ name: 'Classeurs Excel', extensions: ['xlsx'] }],
    });
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
