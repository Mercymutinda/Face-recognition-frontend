import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'Gk$e3lbvXi!n7kpiLamr@i9eZ@q220T4'

export function encrypt(data) {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString()
}

export function decrypt(cipherText) {
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY)
        return bytes.toString(CryptoJS.enc.Utf8)
    } catch {
        return null
    }
}

export function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
        return JSON.parse(jsonPayload)
    } catch (e) {
        console.error('Failed to decode JWT:', e)
        return null
    }
}
