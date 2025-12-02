/**
 * Export centralisé des hooks
 */

export { useEleves } from './useEleves';
export { usePaiements } from './usePaiements';
export { useFamilles } from './useFamilles';
export { useMoratoires } from './useMoratoires';

// export const configswr = {
//     // revalidateOnFocus: ,
//     revalidateOnReconnect: true,
//     dedupingInterval: 10000,        // ✨ 10s entre requêtes
//     keepPreviousData: true,
// }

export const configswr = {
    provider: () => localStorageProvider(),
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
    keepPreviousData: true,
};

export function localStorageProvider() {
    if (typeof window === "undefined") return new Map();

    const map = new Map(
        JSON.parse(localStorage.getItem("swr-cache") || "[]")
    );

    // Sauvegarde automatique du cache
    window.addEventListener("beforeunload", () => {
        const arr = Array.from(map.entries());
        localStorage.setItem("swr-cache", JSON.stringify(arr));
    });

    return map;
}

export async function POST(url, data) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok || json.success === false) {
            throw new Error(json.error || "Erreur réseau");
        }

        return { success: true, data: json.data };

    } catch (err) {
        console.error("POST Error:", err);
        throw err;
    }
}
