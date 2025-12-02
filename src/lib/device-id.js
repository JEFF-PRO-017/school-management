/**
 * Gestion de l'identifiant unique de l'appareil
 * Utilisé pour l'audit des opérations
 */

const DEVICE_ID_KEY = 'school-app-device-key';
const DEVICE_NAME_KEY = 'school-app-device-name';

// Générer un ID unique
function generateDeviceId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `device_${timestamp}_${randomPart}`;
}

// Obtenir ou créer l'ID de l'appareil
export function getDeviceId() {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

// Obtenir le nom de l'appareil (défini par l'utilisateur)
export function getDeviceName() {
  if (typeof window === 'undefined') return 'Serveur';

  return localStorage.getItem(DEVICE_NAME_KEY) || 'Appareil non nommé';
}

// Définir le nom de l'appareil
export function setDeviceName(name) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(DEVICE_NAME_KEY, name);
}

// Obtenir les infos complètes de l'appareil
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'server',
      deviceName: 'Serveur',
      userAgent: 'Node.js',
      platform: 'server',
    };
  }

  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenSize: `${window.screen.width}x${window.screen.height}`,
  };
}

// Vérifier si c'est un nouvel appareil
export function isNewDevice() {

  if (typeof window === 'undefined') return false;

  console.log(localStorage.getItem(DEVICE_NAME_KEY))
  return !localStorage.getItem(DEVICE_NAME_KEY);
}

const admin = [
  'papa', 'JEFF'
];

export function isAdmin() {
  console.log(admin.find(r => r === localStorage.getItem(DEVICE_NAME_KEY)))
  return admin.find(r => r === localStorage.getItem(DEVICE_NAME_KEY));
}