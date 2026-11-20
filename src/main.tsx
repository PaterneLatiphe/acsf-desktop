// Point d'entrée : les styles sont centralisés dans src/styles (tokens, base, composants).

import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/composants.css';
import App from './App';
import { FiletErreur } from './Etats';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <FiletErreur>
    <App />
  </FiletErreur>,
);
