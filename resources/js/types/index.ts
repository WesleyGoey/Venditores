import { LucideIcon } from 'lucide-react';


export interface Auth {
    user: User;
}


export interface BreadcrumbItem {
    title: string;
    href: string;
}


export interface NavGroup {
    title: string;
    items: NavItem[];
}


export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}


export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: FlashMessages;
    [key: string]: unknown;
}


export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}


export interface FlashMessages {
    success?: string | null;
    error?: string | null;
}


export type EventStatus = 'draft' | 'analyzed' | 'completed';
export type ProcurementStatus = 'drafting' | 'searching' | 'quoted' | 'deal' | 'paid';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected';
export type RiskLevel = 'urgent' | 'warning' | 'low';


export interface Option<T extends string = string> {
    value: T;
    label: string;
}


export interface RiskAdvice {
    level: RiskLevel;
    headline: string;
    recommendations: string[];
}


export interface VenditoresEvent {
    id: number;
    name: string;
    event_date: string;
    location: string | null;
    total_budget: number;
    description: string | null;
    proposal_original_name: string | null;
    has_proposal: boolean;
    status: EventStatus;
    summary: string | null;
    scale: 'small' | 'medium' | 'large' | null;
    estimated_attendees: number | null;
    analyzed_at: string | null;
    risk_advice: RiskAdvice | null;
    risk_advised_at: string | null;
    vendor_needs: VendorNeed[];
}


export interface VendorNeed {
    id: number;
    event_id: number;
    category: string;
    specification: string | null;
    allocated_budget: number;
    allocation_basis_points: number | null;
    is_vital: boolean;
    procurement_status: ProcurementStatus;
    quotes_count?: number;
    quotes_max_match_score?: number | null;
    quotes?: Quote[];
}


export interface Quote {
    id: number;
    vendor_need_id: number;
    vendor_name: string;
    vendor_contact: string | null;
    price: number;
    notes: string | null;
    status: QuoteStatus;
    spec_score: number | null;
    budget_score: number | null;
    match_score: number | null;
    match_reason: string | null;
    matched_at: string | null;
}


export interface RiskAssessment {
    level: RiskLevel;
    days_remaining: number;
    unsecured_needs: number;
    unsecured_vital_needs: string[];
}
