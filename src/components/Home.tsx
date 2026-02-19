import { Input } from './ui/input';
import { fetchInvoices, Invoice } from '../lib/supabase';
import { useState, useEffect } from 'react';
import svgPaths from '../imports/svg-2n5pj4qi5n';

interface HomeProps {
  onSelectPet: (id: string) => void;
  onAdminClick: () => void;
}

export default function Home({ onSelectPet, onAdminClick }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await fetchInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  // Calculate overall stats
  const totalRaised = invoices.reduce((sum, pet) => 
    sum + (pet.donations?.reduce((donSum, d) => donSum + d.amount, 0) || 0), 0
  );
  const totalGoal = invoices.reduce((sum, pet) => sum + pet.estimated_cost, 0);
  const overallProgress = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;
  const activeCampaigns = invoices.filter(pet => {
    const totalDonated = pet.donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    return totalDonated < pet.estimated_cost;
  }).length;

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.animal_name.toLowerCase().includes(query) ||
      invoice.animal_type.toLowerCase().includes(query) ||
      invoice.medical_condition.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-[#f8f9fb] min-h-screen relative">
      <div className="min-h-screen pb-20 flex flex-col">
        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-16 max-w-[1200px] mx-auto flex-1">
          {/* Organization Section */}
          <div className="max-w-[840px] mx-auto mb-10 lg:mb-14 text-center">
            <h1 className="text-[26px] lg:text-[32px] font-semibold text-[#0a0a0a] mb-4 leading-tight">
              JLT Cats
            </h1>
            <p className="text-[15px] lg:text-[17px] text-[#4a5568] leading-relaxed mb-8 max-w-[780px] mx-auto">
              We are a dedicated rescue group based in JLT, working tirelessly to provide medical care and shelter for abandoned cats and dogs. Every donation goes directly to veterinary treatment, helping us save more lives in our community.
            </p>

            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm lg:text-[15px]">
                <span className="font-bold text-[#0a0a0a] text-[15px] lg:text-[16px]">
                  ${totalRaised.toLocaleString()} raised of ${totalGoal.toLocaleString()} goal
                </span>
                <span className="text-[#64748b] text-[14px] lg:text-[15px]">
                  {activeCampaigns} active campaigns • {overallProgress}%
                </span>
              </div>
              <div className="w-full bg-[#e2e8f0] rounded-full h-3">
                <div
                  className="bg-[#3b82f6] h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Browse Section */}
          <div className="mb-8 lg:mb-10">
            <h2 className="text-[22px] lg:text-[26px] font-semibold text-[#0a0a0a] mb-2 leading-tight">
              Browse veterinary fundraisers
            </h2>
            <p className="text-[15px] lg:text-[16px] text-[#64748b] leading-relaxed mb-6">
              Help animals in need get the medical care they deserve
            </p>

            {/* Search Bar - Desktop Only */}
            <div className="hidden lg:block max-w-[600px] relative mb-10">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5">
                <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                  <path d={svgPaths.pcddfd00} stroke="#94a3b8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  <path d="M17.5 17.5L13.9167 13.9167" stroke="#94a3b8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search by pet name, type, or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-[52px] bg-white border border-[#e2e8f0] text-[14px] text-[#0a0a0a] placeholder:text-[#94a3b8] rounded-lg shadow-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all"
              />
            </div>

            {/* Search Bar - Mobile */}
            <div className="lg:hidden relative mb-6">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5">
                <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                  <path d={svgPaths.pcddfd00} stroke="#94a3b8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  <path d="M17.5 17.5L13.9167 13.9167" stroke="#94a3b8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search by pet name or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white border border-[#e2e8f0] text-[14px] text-[#0a0a0a] placeholder:text-[#94a3b8] rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">Loading campaigns...</p>
            </div>
          )}

          {/* Desktop Grid */}
          {!loading && (
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {filteredInvoices.map((pet) => (
                <CampaignCardDesktop
                  key={pet.id}
                  pet={pet}
                  onClick={() => onSelectPet(pet.id)}
                />
              ))}
            </div>
          )}

          {/* Mobile List */}
          {!loading && (
            <div className="lg:hidden space-y-4">
              {filteredInvoices.map((pet) => (
                <CampaignCardMobile
                  key={pet.id}
                  pet={pet}
                  onClick={() => onSelectPet(pet.id)}
                />
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No campaigns found matching your search.</p>
            </div>
          )}
        </main>

        {/* Admin Button at Bottom */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 flex justify-center">
          <button 
            onClick={onAdminClick}
            className="text-sm px-8 py-3 border-2 border-[#e5e7eb] rounded-lg hover:bg-[#f8f9fb] hover:border-[#cbd5e1] transition-all font-medium text-[#64748b] hover:text-[#0a0a0a]"
          >
            Log in as admin
          </button>
        </div>
      </div>
    </div>
  );
}

// Desktop Campaign Card
interface CampaignCardProps {
  pet: Invoice;
  onClick: () => void;
}

function CampaignCardDesktop({ pet, onClick }: CampaignCardProps) {
  const totalDonated = pet.donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const progressPercentage = Math.round((totalDonated / pet.estimated_cost) * 100);
  const isFunded = totalDonated >= pet.estimated_cost;
  
  // Use stored status, with fallback logic for backwards compatibility
  let displayStatus = pet.status;
  if (pet.status === 'pending' && totalDonated > 0) {
    displayStatus = 'partially_funded';
  }
  if (totalDonated >= pet.estimated_cost) {
    displayStatus = 'funded';
  }
  
  const petImage = pet.pet_photo || 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=500&fit=crop';

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-64 bg-[#f1f5f9] overflow-hidden">
        <img
          src={petImage}
          alt={pet.animal_name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        {/* Status Badge */}
        <div className="absolute bottom-4 left-4">
          <div 
            className="px-3 py-1.5 rounded-lg text-xs leading-none font-semibold shadow-sm backdrop-blur-sm"
            style={{
              backgroundColor: displayStatus === 'pending' ? 'rgba(254, 243, 199, 0.95)' : displayStatus === 'active' ? 'rgba(219, 234, 254, 0.95)' : displayStatus === 'partially_funded' ? 'rgba(252, 165, 165, 0.95)' : displayStatus === 'closed' ? 'rgba(229, 231, 235, 0.95)' : 'rgba(220, 252, 231, 0.95)',
              color: displayStatus === 'pending' ? '#92400e' : displayStatus === 'active' ? '#1e40af' : displayStatus === 'partially_funded' ? '#991b1b' : displayStatus === 'closed' ? '#374151' : '#15803d'
            }}
          >
            {displayStatus.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-[16px] lg:text-[17px] font-medium text-[#0a0a0a] mb-3 leading-snug min-h-[52px]">
          {pet.animal_name}: {pet.medical_condition}
        </h3>

        {/* Progress Bar */}
        <div className={`h-2.5 rounded-full mb-3 ${
          isFunded ? 'bg-[#3b82f6]' : 'bg-[#e5e7eb]'
        }`}>
          {!isFunded && (
            <div
              className="bg-[#3b82f6] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          )}
        </div>

        {/* Amount */}
        <p className="text-[16px] font-bold text-[#0a0a0a] leading-relaxed">
          ${totalDonated.toLocaleString()} raised of ${pet.estimated_cost.toLocaleString()} goal
        </p>
      </div>
    </div>
  );
}

// Mobile Campaign Card
function CampaignCardMobile({ pet, onClick }: CampaignCardProps) {
  const totalDonated = pet.donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const progressPercentage = Math.round((totalDonated / pet.estimated_cost) * 100);
  const isFunded = totalDonated >= pet.estimated_cost;
  
  // Use stored status, with fallback logic for backwards compatibility
  let displayStatus = pet.status;
  if (pet.status === 'pending' && totalDonated > 0) {
    displayStatus = 'partially_funded';
  }
  if (totalDonated >= pet.estimated_cost) {
    displayStatus = 'funded';
  }
  
  const petImage = pet.pet_photo || 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=500&fit=crop';

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] cursor-pointer active:scale-[0.98] transition-transform p-4"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-[110px] h-[110px] rounded-lg overflow-hidden bg-[#f1f5f9]">
          <img
            src={petImage}
            alt={pet.animal_name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative">
          {/* Donation count */}
          <p className="text-[12px] text-[#64748b] leading-4 mb-1">
            {pet.donations?.length || 0} {(pet.donations?.length || 0) === 1 ? 'donation' : 'donations'}
          </p>

          {/* Title */}
          <h3 className="text-[14px] font-medium text-[#0a0a0a] leading-5 mb-3 pr-20">
            Help {pet.animal_name} - {pet.medical_condition}
          </h3>

          {/* Status Badge - Positioned absolute on right */}
          <div className="absolute top-0 right-0">
            <div 
              className="px-2.5 py-1 rounded-lg text-[11px] leading-none font-semibold shadow-sm"
              style={{
                backgroundColor: displayStatus === 'pending' ? '#fef3c7' : displayStatus === 'active' ? '#dbeafe' : displayStatus === 'partially_funded' ? '#fca5a5' : displayStatus === 'closed' ? '#e5e7eb' : '#dcfce7',
                color: displayStatus === 'pending' ? '#92400e' : displayStatus === 'active' ? '#1e40af' : displayStatus === 'partially_funded' ? '#991b1b' : displayStatus === 'closed' ? '#374151' : '#15803d'
              }}
            >
              {displayStatus.replace('_', ' ')}
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`h-2 rounded-full mb-2 ${
            isFunded ? 'bg-[#3b82f6]' : 'bg-[#e5e7eb]'
          }`}>
            {!isFunded && (
              <div
                className="bg-[#3b82f6] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            )}
          </div>

          {/* Amount */}
          <p className="text-[13px] font-semibold text-[#0a0a0a] leading-5">
            ${totalDonated.toLocaleString()} raised of ${pet.estimated_cost.toLocaleString()} goal
          </p>
        </div>
      </div>
    </div>
  );
}
