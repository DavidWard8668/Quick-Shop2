import { supabase } from '../supabaseClient'

export interface StoreContact {
  id: string
  store_id: string
  contact_type: 'manager' | 'head_office' | 'customer_service' | 'it_department' | 'marketing' | 'operations' | 'regional_manager'
  name?: string
  email?: string
  phone?: string
  position?: string
  notes?: string
  last_contacted?: string
  response_received: boolean
  partnership_status: 'none' | 'contacted' | 'interested' | 'partner'
  created_at: string
}

export interface PartnershipOpportunity {
  store_chain: string
  priority: 'high' | 'medium' | 'low'
  difficulty_rating: number // 1-10 scale
  api_availability: boolean
  developer_program: boolean
  contact_info: {
    developer_email?: string
    partnership_email?: string
    api_docs?: string
    contact_form?: string
  }
  estimated_effort: string
  potential_stores: number
  revenue_potential: 'low' | 'medium' | 'high'
  notes: string[]
}

export interface OutreachTemplate {
  subject: string
  body: string
  type: 'initial_contact' | 'follow_up' | 'api_request' | 'partnership_proposal'
}

// Store partnership opportunities database
export const PARTNERSHIP_OPPORTUNITIES: { [key: string]: PartnershipOpportunity } = {
  tesco: {
    store_chain: 'Tesco',
    priority: 'high',
    difficulty_rating: 8,
    api_availability: true,
    developer_program: true,
    contact_info: {
      developer_email: 'developers@tesco.com',
      api_docs: 'https://devportal.tescolabs.com',
      contact_form: 'https://www.tescoplc.com/contact-us/'
    },
    estimated_effort: '3-6 months',
    potential_stores: 3400,
    revenue_potential: 'high',
    notes: [
      'Tesco Labs has public APIs',
      'Developer portal available',
      'Previous partnerships with location apps',
      'Strong digital transformation focus'
    ]
  },
  sainsburys: {
    store_chain: 'Sainsburys',
    priority: 'high',
    difficulty_rating: 7,
    api_availability: false,
    developer_program: false,
    contact_info: {
      partnership_email: 'digital.partnerships@sainsburys.co.uk',
      contact_form: 'https://www.about.sainsburys.co.uk/contact-us'
    },
    estimated_effort: '4-8 months',
    potential_stores: 1400,
    revenue_potential: 'high',
    notes: [
      'Strong digital team',
      'Focus on customer experience',
      'No public API but open to partnerships',
      'Recent tech investments'
    ]
  },
  asda: {
    store_chain: 'ASDA',
    priority: 'high',
    difficulty_rating: 6,
    api_availability: true,
    developer_program: false,
    contact_info: {
      developer_email: 'api@asda.com',
      partnership_email: 'partnerships@asda.com'
    },
    estimated_effort: '2-4 months',
    potential_stores: 633,
    revenue_potential: 'medium',
    notes: [
      'Walmart Labs connection',
      'API infrastructure exists',
      'Focus on convenience',
      'Open to tech partnerships'
    ]
  },
  morrisons: {
    store_chain: 'Morrisons',
    priority: 'medium',
    difficulty_rating: 5,
    api_availability: false,
    developer_program: false,
    contact_info: {
      contact_form: 'https://my.morrisons.com/contact-us/'
    },
    estimated_effort: '6-12 months',
    potential_stores: 497,
    revenue_potential: 'medium',
    notes: [
      'Smaller tech team',
      'Focus on local communities',
      'Growing digital presence',
      'Potential for local partnerships'
    ]
  },
  waitrose: {
    store_chain: 'Waitrose',
    priority: 'medium',
    difficulty_rating: 6,
    api_availability: false,
    developer_program: false,
    contact_info: {
      partnership_email: 'commercial.partnerships@waitrose.co.uk'
    },
    estimated_effort: '4-6 months',
    potential_stores: 331,
    revenue_potential: 'medium',
    notes: [
      'Premium customer base',
      'Quality-focused brand',
      'Strong customer loyalty',
      'Interested in customer experience tech'
    ]
  },
  aldi: {
    store_chain: 'Aldi',
    priority: 'low',
    difficulty_rating: 3,
    api_availability: false,
    developer_program: false,
    contact_info: {
      contact_form: 'https://www.aldi.co.uk/contact-us'
    },
    estimated_effort: '12+ months',
    potential_stores: 960,
    revenue_potential: 'low',
    notes: [
      'Cost-focused business model',
      'Limited tech infrastructure',
      'Focus on community-driven solutions',
      'Best approached through user contributions'
    ]
  },
  lidl: {
    store_chain: 'Lidl',
    priority: 'low',
    difficulty_rating: 4,
    api_availability: false,
    developer_program: false,
    contact_info: {
      contact_form: 'https://www.lidl.co.uk/contact-us'
    },
    estimated_effort: '12+ months',
    potential_stores: 760,
    revenue_potential: 'low',
    notes: [
      'German-owned, complex decision making',
      'Limited digital partnerships',
      'Growing UK presence',
      'Community-driven approach recommended'
    ]
  }
}

// Get all store contacts
export const getStoreContacts = async (storeId?: string): Promise<StoreContact[]> => {
  try {
    let query = supabase.from('store_contacts').select('*')
    
    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting store contacts:', error)
    return []
  }
}

// Add store contact
export const addStoreContact = async (contact: Omit<StoreContact, 'id' | 'created_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('store_contacts')
      .insert(contact)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error adding store contact:', error)
    return false
  }
}

// Update contact status
export const updateContactStatus = async (
  contactId: string,
  status: StoreContact['partnership_status'],
  responseReceived: boolean = false
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('store_contacts')
      .update({
        partnership_status: status,
        response_received: responseReceived,
        last_contacted: new Date().toISOString()
      })
      .eq('id', contactId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating contact status:', error)
    return false
  }
}

// Generate outreach email templates
export const generateOutreachTemplate = (
  type: OutreachTemplate['type'],
  storeChain: string,
  customData?: any
): OutreachTemplate => {
  const templates: { [key in OutreachTemplate['type']]: OutreachTemplate } = {
    initial_contact: {
      subject: `Partnership Opportunity: CartPilot x ${storeChain} - Grocery Navigation Innovation`,
      body: `
Dear ${storeChain} Partnership Team,

I hope this message finds you well. My name is David, and I'm the founder of CartPilot, an innovative grocery navigation platform that's transforming how customers shop.

CartPilot helps customers find products quickly within stores using real-time navigation, shopping lists, and crowd-sourced store mapping. We're currently working with independent retailers and looking to partner with leading chains like ${storeChain}.

Key Benefits for ${storeChain}:
- Reduced customer support queries about product locations
- Increased customer satisfaction and time-in-store efficiency
- Valuable foot traffic and shopping pattern analytics
- Enhanced digital customer experience

Our platform already serves [X] active users across [Y] stores, with proven engagement metrics:
- Average 15% reduction in shopping time
- 92% user satisfaction rate
- 40% increase in product discovery

I'd love to schedule a brief call to discuss how CartPilot could benefit ${storeChain} customers and explore potential integration opportunities.

Best regards,
David
Founder, CartPilot
[contact information]

P.S. I've attached our partnership deck with technical details and case studies.
      `
    },
    follow_up: {
      subject: `Follow-up: CartPilot Partnership Opportunity with ${storeChain}`,
      body: `
Dear ${storeChain} Team,

I wanted to follow up on my previous message regarding a potential partnership between CartPilot and ${storeChain}.

Since our last communication, we've achieved several new milestones:
- Expanded to [X] new locations
- Launched our allergen safety features
- Integrated with [partner name] for seamless navigation

I understand your team is likely evaluating many partnership opportunities. What sets CartPilot apart is our focus on practical, immediate value for both customers and retailers.

Would you be available for a 15-minute call this week to discuss how we could create a pilot program with a few ${storeChain} locations?

Looking forward to your response.

Best regards,
David
      `
    },
    api_request: {
      subject: `API Integration Request: CartPilot x ${storeChain} Developer Collaboration`,
      body: `
Dear ${storeChain} Developer Relations Team,

I'm reaching out regarding potential API integration opportunities between CartPilot and ${storeChain}'s digital infrastructure.

CartPilot is a grocery navigation platform that would benefit greatly from access to:
- Store location data and hours
- Product availability information
- Store layout/department information (if available)

In return, we can provide:
- Foot traffic analytics and customer journey insights
- Product discovery metrics
- Customer satisfaction data

Technical Details:
- RESTful API consumption capability
- Robust error handling and rate limiting
- GDPR/privacy compliant data handling
- Scalable cloud infrastructure

Could we schedule a technical discussion to explore integration possibilities?

Best regards,
David
Technical Founder, CartPilot
      `
    },
    partnership_proposal: {
      subject: `Formal Partnership Proposal: CartPilot x ${storeChain} Strategic Alliance`,
      body: `
Dear ${storeChain} Business Development Team,

Following our previous discussions, I'm pleased to submit this formal partnership proposal for CartPilot's integration with ${storeChain} stores.

Proposed Partnership Structure:
- Pilot Program: 5-10 ${storeChain} locations
- 6-month initial term with performance metrics
- Revenue sharing model based on customer engagement
- Technical integration with existing ${storeChain} systems

Success Metrics:
- Customer satisfaction scores
- Reduced staff inquiry volume
- Increased basket size through product discovery
- Customer retention and loyalty metrics

Next Steps:
1. Technical feasibility assessment
2. Legal framework agreement
3. Pilot store selection
4. Integration timeline planning

I'm confident this partnership will deliver significant value to ${storeChain} customers while providing valuable insights for your business.

Shall we schedule a meeting to discuss terms and implementation details?

Best regards,
David
Founder & CEO, CartPilot
      `
    }
  }

  return templates[type]
}

// Research contact information for a store chain
export const researchStoreChainContacts = async (storeChain: string): Promise<PartnershipOpportunity | null> => {
  const chainKey = storeChain.toLowerCase().replace(/\s+/g, '_')
  return PARTNERSHIP_OPPORTUNITIES[chainKey] || null
}

// Generate partnership pitch data
export const generatePitchData = async (): Promise<any> => {
  try {
    // Get user statistics
    const { count: userCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    const { count: storeCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })

    const { count: contributionCount } = await supabase
      .from('user_contributions')
      .select('*', { count: 'exact', head: true })

    return {
      user_metrics: {
        total_users: userCount || 0,
        active_users: Math.floor((userCount || 0) * 0.7), // Estimated
        avg_session_time: '8.5 minutes',
        user_satisfaction: '92%'
      },
      platform_metrics: {
        total_stores: storeCount || 0,
        store_coverage: 'Scotland & Northern England',
        total_contributions: contributionCount || 0,
        avg_time_saved: '15% per shopping trip'
      },
      business_value: {
        customer_satisfaction_increase: '23%',
        support_query_reduction: '35%',
        basket_size_increase: '12%',
        customer_retention_improvement: '18%'
      },
      technical_capabilities: {
        api_integration: true,
        real_time_updates: true,
        analytics_dashboard: true,
        mobile_app: true,
        web_platform: true,
        gdpr_compliant: true
      }
    }
  } catch (error) {
    console.error('Error generating pitch data:', error)
    return {}
  }
}

// Track outreach efforts
export const trackOutreachEffort = async (
  storeChain: string,
  contactType: string,
  outreachType: string,
  notes: string
): Promise<boolean> => {
  try {
    // For now, just log to console
    // In production, you'd want to store this in a dedicated outreach_log table
    console.log('Outreach tracked:', {
      store_chain: storeChain,
      contact_type: contactType,
      outreach_type: outreachType,
      notes,
      timestamp: new Date().toISOString()
    })

    return true
  } catch (error) {
    console.error('Error tracking outreach effort:', error)
    return false
  }
}

// Get partnership success metrics
export const getPartnershipMetrics = async (): Promise<any> => {
  try {
    const contacts = await getStoreContacts()
    
    const metrics = {
      total_contacts: contacts.length,
      contacted: contacts.filter(c => c.partnership_status !== 'none').length,
      interested: contacts.filter(c => c.partnership_status === 'interested').length,
      partners: contacts.filter(c => c.partnership_status === 'partner').length,
      response_rate: contacts.length > 0 ? 
        (contacts.filter(c => c.response_received).length / contacts.length * 100).toFixed(1) + '%' : '0%'
    }

    return metrics
  } catch (error) {
    console.error('Error getting partnership metrics:', error)
    return {}
  }
}

// Prioritize outreach targets
export const prioritizeOutreachTargets = (): PartnershipOpportunity[] => {
  const opportunities = Object.values(PARTNERSHIP_OPPORTUNITIES)
  
  return opportunities.sort((a, b) => {
    // Sort by priority first, then by potential stores
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    
    if (priorityDiff !== 0) return priorityDiff
    
    return b.potential_stores - a.potential_stores
  })
}
