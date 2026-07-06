/**
 * District Lookup Utility
 * Uses Mapbox Geocoding API to convert addresses to coordinates,
 * then uses Mapbox Tilequery API to determine which districts the location falls into.
 */

/**
 * Geocode an address using Mapbox Geocoding API directly
 * @param {string} address - The address to geocode
 * @param {string} mapboxToken - Mapbox access token
 * @returns {Promise<Object>} Object containing lat, lng, and formatted address
 */
export async function geocodeAddress(address, mapboxToken) {
    // Call Mapbox Geocoding API directly from client
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodedAddress}&country=US&bbox=-92.889,42.491,-86.249,47.309&access_token=${mapboxToken}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            throw new Error('Address not found. Please enter a complete physical address including street number, street name, and city.');
        }

        const feature = data.features[0];
        
        // Additional validation: ensure it's actually an address type, not a place/city
        if (!feature.properties.feature_type || !feature.properties.feature_type.includes('address')) {
            throw new Error('districtLookup: Please enter a complete physical address with a street number, not just a city or street name.');
        }
        
        const context = data.features[1].properties.context || {};
        const isInWisconsin = context.region?.region_code === "WI";
        
        if (!isInWisconsin) {
            throw new Error('Address must be in Wisconsin');
        }
        
        const [lng, lat] = feature.geometry.coordinates;

        return {
            lat,
            lng,
            formattedAddress: feature.properties.full_address,
            bbox: data.features[1].properties.bbox
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

/**
 * Query district information for a point using Mapbox Tilequery API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} districtType - 'assembly', 'senate', or 'congress'
 * @param {string} accessToken - Mapbox access token
 * @returns {Promise<string|null>} District number or null if not found
 */
export async function queryDistrictAtPoint(lat, lng, districtType, accessToken) {
    if (!accessToken) {
        throw new Error('Mapbox access token not configured');
    }

    // Mapbox tileset IDs
    const tilesetMap = {
        assembly: 'wisconsinwatch.6gs2v405',
        senate: 'wisconsinwatch.7scp33x9',     // Swapped: this one has SEN2024
        congress: 'wisconsinwatch.5mz9q1z2'    // Swapped: this one has CON2021
    };

    // Possible property keys for each district type
    const propertyOptions = {
        assembly: ['ASM2024', 'ASM', 'ASSEMBLY', 'Assembly', 'assembly'],
        senate: ['SEN2024', 'SEN', 'SENATE', 'Senate', 'senate'],
        congress: ['CON2021', 'CON2022', 'CON2024', 'CD', 'DISTRICT', 'CONG_DIST', 'CD_116', 'CD2022', 'CD2024', 'congressional_district', 'CONGRESSIONAL']
    };

    const tilesetId = tilesetMap[districtType];
    const possibleKeys = propertyOptions[districtType];

    if (!tilesetId) {
        throw new Error(`Invalid district type: ${districtType}`);
    }

    try {
        // Mapbox Tilequery API: query features at a specific point
        const url = `https://api.mapbox.com/v4/${tilesetId}/tilequery/${lng},${lat}.json?access_token=${accessToken}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to query ${districtType} district from Mapbox: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Find the first feature that contains our point
        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            
            // Try all possible property names
            for (const key of possibleKeys) {
                if (feature.properties[key] !== undefined && feature.properties[key] !== null) {
                    console.log(`Found ${districtType} district using property: ${key} = ${feature.properties[key]}`);
                    return String(feature.properties[key]);
                }
            }
            
            // Log all available properties for debugging
            console.log(`${districtType} properties available:`, Object.keys(feature.properties));
        }
        
        return null;
    } catch (error) {
        console.error(`Error querying ${districtType} district from Mapbox:`, error);
        throw error;
    }
}

/**
 * Find all districts for a given address using Mapbox Tilequery API
 * @param {string} address - The address to look up
 * @param {string} accessToken - Mapbox access token
 * @returns {Promise<Object>} Object containing coordinates and district information
 */
export async function findDistrictsForAddress(address, accessToken) {
    // Geocode the address
    const location = await geocodeAddress(address, accessToken);

    // Query all districts in parallel using Tilequery API
    const [assemblyDistrict, senateDistrict, congressDistrict] = await Promise.all([
        queryDistrictAtPoint(location.lat, location.lng, 'assembly', accessToken),
        queryDistrictAtPoint(location.lat, location.lng, 'senate', accessToken),
        queryDistrictAtPoint(location.lat, location.lng, 'congress', accessToken)
    ]);

    return {
        address: location.formattedAddress,
        coordinates: {
            lat: location.lat,
            lng: location.lng
        },
        districts: {
            assembly: assemblyDistrict,
            senate: senateDistrict,
            congress: congressDistrict
        }
    };
}
