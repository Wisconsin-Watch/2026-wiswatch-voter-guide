/** @type {import('./$types').PageLoad} */
export async function load({ data }) {
    return {
        ...data,
        mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
    };
}
