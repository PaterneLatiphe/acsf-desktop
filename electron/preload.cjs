const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('acsfDisque', {
  lire: () => ipcRenderer.invoke('acsf:disque:lire'),
  ecrire: (donnees) => ipcRenderer.invoke('acsf:disque:ecrire', donnees),
  lireWasm: () => ipcRenderer.invoke('acsf:disque:lireWasm'),
  sauvegarder: () => ipcRenderer.invoke('acsf:disque:sauvegarder'),
});
