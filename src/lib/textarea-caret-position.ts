// Utilitaire pour calculer la position du caret/sélection dans une textarea
// Inspiré de la bibliothèque textarea-caret-position

export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

// Les propriétés CSS à copier depuis la textarea vers le div miroir
const PROPERTIES = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
  'whiteSpace',
];

let mirrorDiv: HTMLDivElement | null = null;

export function getTextareaCaretPosition(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number
): CaretCoordinates {
  // Créer le div miroir s'il n'existe pas
  if (!mirrorDiv) {
    mirrorDiv = document.createElement('div');
    mirrorDiv.id = 'textarea-caret-position-mirror-div';
    document.body.appendChild(mirrorDiv);
  }

  const computed = window.getComputedStyle(element);
  const isInput = element.nodeName === 'INPUT';

  // Définir les styles par défaut
  mirrorDiv.style.position = 'absolute';
  mirrorDiv.style.visibility = 'hidden';
  mirrorDiv.style.whiteSpace = 'pre-wrap';
  
  if (!isInput) {
    mirrorDiv.style.wordWrap = 'break-word';
  }

  // Copier les styles de la textarea/input
  PROPERTIES.forEach((prop) => {
    const propValue = computed.getPropertyValue(prop);
    if (prop === 'width' && mirrorDiv!.scrollHeight > parseInt(propValue)) {
      mirrorDiv!.style.overflowY = 'scroll';
    } else {
      mirrorDiv!.style.setProperty(prop, propValue);
    }
  });

  if (isInput) {
    mirrorDiv.style.overflow = 'hidden';
  }

  // Gérer le texte
  const textContent = element.value.substring(0, position);
  
  // Insérer le texte jusqu'à la position du caret
  mirrorDiv.textContent = textContent;
  
  if (element.nodeName === 'INPUT') {
    mirrorDiv.textContent = mirrorDiv.textContent.replace(/\s/g, '\u00a0');
  }

  // Créer un span pour marquer la position du caret
  const span = document.createElement('span');
  span.textContent = '|'; // Utiliser un caractère pour avoir une hauteur
  mirrorDiv.appendChild(span);

  // Obtenir la position du span
  const coordinates = {
    top: span.offsetTop - element.scrollTop,
    left: span.offsetLeft - element.scrollLeft,
    height: span.offsetHeight
  };

  // Nettoyer le div miroir pour la prochaine utilisation
  mirrorDiv.textContent = '';

  return coordinates;
}

// Fonction pour obtenir la position du haut et du milieu horizontal d'une sélection
export function getSelectionCoordinates(
  element: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number
): CaretCoordinates {
  const startPos = getTextareaCaretPosition(element, selectionStart);
  const endPos = getTextareaCaretPosition(element, selectionEnd);
  
  // Si la sélection est sur la même ligne
  if (Math.abs(startPos.top - endPos.top) < 5) {
    return {
      top: startPos.top, // Utiliser le haut de la ligne
      left: (startPos.left + endPos.left) / 2, // Milieu horizontal
      height: startPos.height
    };
  }
  
  // Si la sélection est sur plusieurs lignes, prendre le début
  return startPos;
}