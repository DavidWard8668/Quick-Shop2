import { supabase } from '../supabaseClient'

export interface StoreHours {
  id: string
  store_id: string
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  open_time: string | null // "09:00"
  close_time: string | null // "22:00"
  is_closed: boolean
  is_24_hours: boolean
}

export interface StoreStatus {
  isOpen: boolean
  opensAt?: string
  closesAt?: string
  opensNext?: string
  is24Hours: boolean
  status: 'open' | 'closed' | 'closing_soon' | 'unknown'
}

// Get store hours from database
export const getStoreHours = async (storeId: string): Promise<StoreHours[]> => {
  try {
    const { data, error } = await supabase
      .from('store_hours')
      .select('*')
      .eq('store_id', storeId)
      .order('day_of_week')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching store hours:', error)
    return []
  }
}

// Parse opening hours text and save to structured format
export const parseAndSaveStoreHours = async (storeId: string, openingHoursText: string): Promise<void> => {
  try {
    const hours = parseOpeningHours(openingHoursText)
    
    // Delete existing hours
    await supabase
      .from('store_hours')
      .delete()
      .eq('store_id', storeId)

    // Insert new hours
    if (hours.length > 0) {
      const { error } = await supabase
        .from('store_hours')
        .insert(hours.map(hour => ({ ...hour, store_id: storeId })))

      if (error) throw error
    }
  } catch (error) {
    console.error('Error saving store hours:', error)
  }
}

// Get current store status
export const getStoreStatus = async (storeId: string): Promise<StoreStatus> => {
  try {
    const hours = await getStoreHours(storeId)
    return calculateStoreStatus(hours)
  } catch (error) {
    console.error('Error getting store status:', error)
    return {
      isOpen: false,
      is24Hours: false,
      status: 'unknown'
    }
  }
}

// Calculate if store is currently open
const calculateStoreStatus = (hours: StoreHours[]): StoreStatus => {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const todayHours = hours.find(h => h.day_of_week === currentDay)
  
  if (!todayHours) {
    return {
      isOpen: false,
      is24Hours: false,
      status: 'unknown'
    }
  }

  // Check if closed today
  if (todayHours.is_closed) {
    const tomorrowHours = hours.find(h => h.day_of_week === (currentDay + 1) % 7)
    return {
      isOpen: false,
      is24Hours: false,
      status: 'closed',
      opensNext: tomorrowHours && !tomorrowHours.is_closed ? tomorrowHours.open_time || undefined : undefined
    }
  }

  // Check if 24 hours
  if (todayHours.is_24_hours) {
    return {
      isOpen: true,
      is24Hours: true,
      status: 'open'
    }
  }

  // Check if currently open
  const openTime = todayHours.open_time
  const closeTime = todayHours.close_time

  if (!openTime || !closeTime) {
    return {
      isOpen: false,
      is24Hours: false,
      status: 'unknown'
    }
  }

  const isOpen = currentTime >= openTime && currentTime < closeTime
  const closingSoon = isOpen && getMinutesDifference(currentTime, closeTime) <= 60

  return {
    isOpen,
    opensAt: openTime,
    closesAt: closeTime,
    is24Hours: false,
    status: isOpen ? (closingSoon ? 'closing_soon' : 'open') : 'closed'
  }
}

// Parse various opening hours formats
const parseOpeningHours = (hoursText: string): Partial<StoreHours>[] => {
  const hours: Partial<StoreHours>[] = []
  
  if (!hoursText || hoursText.toLowerCase().includes('24/7') || hoursText.toLowerCase().includes('24 hours')) {
    // 24/7 store
    for (let day = 0; day < 7; day++) {
      hours.push({
        day_of_week: day,
        is_24_hours: true,
        is_closed: false
      })
    }
    return hours
  }

  // Common formats:
  // "Mo-Sa 08:00-20:00; Su 10:00-18:00"
  // "Monday-Saturday: 8:00 AM - 8:00 PM, Sunday: 10:00 AM - 6:00 PM"
  // "8:00 - 22:00"
  
  const dayAbbreviations: Record<string, number[]> = {
    'mo': [1], 'tu': [2], 'we': [3], 'th': [4], 'fr': [5], 'sa': [6], 'su': [0],
    'monday': [1], 'tuesday': [2], 'wednesday': [3], 'thursday': [4], 'friday': [5], 'saturday': [6], 'sunday': [0],
    'mo-sa': [1,2,3,4,5,6], 'mo-fr': [1,2,3,4,5], 'sa-su': [6,0]
  }

  // Simple format: just times (assume applies to all days)
  const simpleTimeMatch = hoursText.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
  if (simpleTimeMatch && !hoursText.toLowerCase().includes('mo') && !hoursText.toLowerCase().includes('monday')) {
    const openTime = `${simpleTimeMatch[1].padStart(2, '0')}:${simpleTimeMatch[2]}`
    const closeTime = `${simpleTimeMatch[3].padStart(2, '0')}:${simpleTimeMatch[4]}`
    
    for (let day = 0; day < 7; day++) {
      hours.push({
        day_of_week: day,
        open_time: openTime,
        close_time: closeTime,
        is_closed: false,
        is_24_hours: false
      })
    }
    return hours
  }

  // Initialize all days as closed
  for (let day = 0; day < 7; day++) {
    hours.push({
      day_of_week: day,
      is_closed: true,
      is_24_hours: false
    })
  }

  return hours
}

// Helper function to calculate minute difference
const getMinutesDifference = (time1: string, time2: string): number => {
  const [h1, m1] = time1.split(':').map(Number)
  const [h2, m2] = time2.split(':').map(Number)
  
  const minutes1 = h1 * 60 + m1
  const minutes2 = h2 * 60 + m2
  
  return minutes2 - minutes1
}

// Get store status for multiple stores
export const getMultipleStoreStatuses = async (storeIds: string[]): Promise<Record<string, StoreStatus>> => {
  const statuses: Record<string, StoreStatus> = {}
  
  await Promise.all(
    storeIds.map(async (storeId) => {
      statuses[storeId] = await getStoreStatus(storeId)
    })
  )
  
  return statuses
}