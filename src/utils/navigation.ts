// Enhanced navigation function with routing options
export const navigateToStore = (
  lat: number, 
  lng: number, 
  storeName: string, 
  showRoute: boolean = true
): void => {
  const destination = `${lat},${lng}`
  const encodedName = encodeURIComponent(storeName)
  
  // Detect device type
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  
  try {
    if (isIOS) {
      // iOS - Apple Maps with routing
      const appleUrl = showRoute 
        ? `maps://?daddr=${destination}&dirflg=d&t=m`
        : `maps://?q=${destination}&ll=${destination}`
      window.location.href = appleUrl
    } else if (isAndroid) {
      // Android - Google Maps with routing
      const googleUrl = showRoute
        ? `google.navigation:q=${destination}&mode=d`
        : `geo:${destination}?q=${destination}(${encodedName})`
      window.location.href = googleUrl
    } else {
      // Fallback - Web Google Maps with routing
      const webUrl = showRoute
        ? `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
        : `https://www.google.com/maps/search/?api=1&query=${destination}`
      window.open(webUrl, '_blank')
    }
    
    console.log(`Navigation requested for ${storeName} at ${destination}`)
  } catch (error) {
    console.error('Navigation error:', error)
    // Fallback to web maps
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`
    window.open(webUrl, '_blank')
  }
}