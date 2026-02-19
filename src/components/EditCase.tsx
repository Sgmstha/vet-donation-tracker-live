import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Trash2, Plus, X, Save, FileText, Loader2, Upload } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { fetchInvoiceById, updateInvoice, deleteInvoice, addDonation, deleteDonation, uploadFileToStorage, type Invoice, type Donation } from '../lib/supabase';

interface EditCaseProps {
  petId: string;
  onBack: () => void;
}

export default function EditCase({ petId, onBack }: EditCaseProps) {
  const [pet, setPet] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalCase, setOriginalCase] = useState({
    animal_name: '',
    medical_condition: '',
    estimated_cost: '',
    payment_link: '',
    pet_story: '',
    instagram_link: '',
    status: 'pending' as any
  });
  const [editedCase, setEditedCase] = useState({
    animal_name: '',
    medical_condition: '',
    estimated_cost: '',
    payment_link: '',
    pet_story: '',
    instagram_link: '',
    status: 'pending' as any
  });
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newDonation, setNewDonation] = useState({
    amount: '',
    donor_name: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [isUploadingInvoices, setIsUploadingInvoices] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadPet = async () => {
      try {
        const data = await fetchInvoiceById(petId);
        if (data) {
          setPet(data);
          const caseData = {
            animal_name: data.animal_name,
            medical_condition: data.medical_condition,
            estimated_cost: data.estimated_cost.toString(),
            payment_link: data.payment_link || '',
            pet_story: data.pet_story || '',
            instagram_link: data.instagram_link || '',
            status: data.status
          };
          setOriginalCase(caseData);
          setEditedCase(caseData);
          setDonations(data.donations || []);
        }
      } catch (error) {
        console.error('Failed to load pet:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPet();
  }, [petId]);

  // Track changes
  useEffect(() => {
    const hasChanges = 
      JSON.stringify(editedCase) !== JSON.stringify(originalCase) ||
      photoFile !== null ||
      invoiceFiles.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [editedCase, originalCase, photoFile, invoiceFiles]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <p className="text-center text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <p className="text-center text-slate-600">Case not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const progressPercentage = Math.round((totalDonated / parseFloat(editedCase.estimated_cost)) * 100);
  const remaining = parseFloat(editedCase.estimated_cost) - totalDonated;

  const handleSave = async () => {
    if (!editedCase.animal_name || !editedCase.medical_condition || !editedCase.estimated_cost) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      let updates: any = {
        animal_name: editedCase.animal_name,
        medical_condition: editedCase.medical_condition,
        estimated_cost: parseFloat(editedCase.estimated_cost),
        payment_link: editedCase.payment_link,
        pet_story: editedCase.pet_story,
        instagram_link: editedCase.instagram_link,
        status: editedCase.status as any
      };

      // Upload new photo if provided
      if (photoFile) {
        const timestamp = Date.now();
        const photoPath = `pet-photos/${timestamp}-${photoFile.name}`;
        const photoUrl = await uploadFileToStorage(photoFile, 'pet-images', photoPath);
        
        if (!photoUrl) {
          alert('Failed to upload photo. Please try again.');
          setIsSaving(false);
          return;
        }
        
        updates.pet_photo = photoUrl;
      }

      // Upload new invoices if provided (multiple files)
      if (invoiceFiles.length > 0) {
        setIsUploadingInvoices(true);
        const invoiceUrls: string[] = [];
        
        for (const file of invoiceFiles) {
          const timestamp = Date.now();
          const invoicePath = `invoices/${timestamp}-${file.name}`;
          const invoiceUrl = await uploadFileToStorage(file, 'pet-invoices', invoicePath);
          
          if (invoiceUrl) {
            invoiceUrls.push(invoiceUrl);
          }
        }
        
        if (invoiceUrls.length === 0) {
          alert('Failed to upload invoices. Please try again.');
          setIsSaving(false);
          setIsUploadingInvoices(false);
          return;
        }
        
        // For now, store the first invoice URL (database schema may need update for multiple)
        updates.invoice_file = invoiceUrls[0];
        setIsUploadingInvoices(false);
      }

      await updateInvoice(petId, updates);
      alert('Case saved successfully!');
      setPhotoFile(null);
      setInvoiceFiles([]);
      setHasUnsavedChanges(false);
      onBack();
    } catch (error) {
      console.error('Error saving case:', error);
      alert('Failed to save case. Please try again.');
    } finally {
      setIsSaving(false);
      setIsUploadingInvoices(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${pet.animal_name}'s case? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await deleteInvoice(petId);
        alert('Case deleted successfully!');
        onBack();
      } catch (error) {
        console.error('Error deleting case:', error);
        alert('Failed to delete case. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAddDonation = async () => {
    if (!newDonation.amount || parseFloat(newDonation.amount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    try {
      const donation = await addDonation(petId, {
        amount: parseFloat(newDonation.amount),
        donor_name: newDonation.donor_name || undefined
      });
      if (donation) {
        setDonations([...donations, donation]);
        setNewDonation({ amount: '', donor_name: '' });
        setShowDonationForm(false);
      }
    } catch (error) {
      console.error('Error adding donation:', error);
      alert('Failed to add donation. Please try again.');
    }
  };

  const handleDeleteDonation = async (donationId: string) => {
    if (confirm('Are you sure you want to delete this donation?')) {
      try {
        await deleteDonation(donationId);
        setDonations(donations.filter(d => d.id !== donationId));
      } catch (error) {
        console.error('Error deleting donation:', error);
        alert('Failed to delete donation. Please try again.');
      }
    }
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setInvoiceFiles([...invoiceFiles, ...files]);
    }
  };

  const removeInvoiceFile = (index: number) => {
    setInvoiceFiles(invoiceFiles.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eff6ff] to-white">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0] shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-2">
            <Button 
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="gap-2 text-[#0a0a0a] hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-2xl text-[#0f172b]">JLT Cat Lovers' Group</h1>
            <p className="text-sm text-[#717182] mt-1">Case Management • {pet.animal_name}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Pet Photo */}
            <Card className="bg-white border-[#e2e8f0]">
              <CardContent className="pt-6">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-[#f1f5f9] mb-4">
                  {pet.pet_photo ? (
                    <img
                      src={pet.pet_photo}
                      alt={pet.animal_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#45556c]">
                      No photo uploaded
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pet-photo">Change Pet Photo</Label>
                  <div className="relative">
                    <input
                      id="pet-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label 
                      htmlFor="pet-photo"
                      className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="size-5 text-blue-600" />
                      <span className="text-sm text-blue-600">
                        {photoFile ? photoFile.name : 'Click to upload new photo'}
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="bg-white border-[#e2e8f0]">
              <CardHeader>
                <CardTitle className="text-xl">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pet-name">Pet Name *</Label>
                  <Input
                    id="pet-name"
                    value={editedCase.animal_name}
                    onChange={(e) => setEditedCase({ ...editedCase, animal_name: e.target.value })}
                    className="bg-[#f3f3f5] border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    value={editedCase.status}
                    onChange={(e) => setEditedCase({ ...editedCase, status: e.target.value as Invoice['status'] })}
                    className="w-full h-10 px-3 rounded-lg bg-[#f3f3f5] border-0"
                  >
                    <option value="pending">Pending</option>
                    <option value="partially_funded">Partially Funded</option>
                    <option value="funded">Funded</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatment">Treatment Description *</Label>
                  <Textarea
                    id="treatment"
                    value={editedCase.medical_condition}
                    onChange={(e) => setEditedCase({ ...editedCase, medical_condition: e.target.value })}
                    rows={4}
                    className="bg-[#f3f3f5] border-0 max-h-32 overflow-y-auto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Total Cost/Debt Amount *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={editedCase.estimated_cost}
                    onChange={(e) => setEditedCase({ ...editedCase, estimated_cost: e.target.value })}
                    className="bg-[#f3f3f5] border-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pet's Story */}
            <Card className="bg-white border-[#e2e8f0]">
              <CardHeader>
                <CardTitle className="text-xl">Pet's Story</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="pet-story">Pet Story/Background</Label>
                  <Textarea
                    id="pet-story"
                    value={editedCase.pet_story}
                    onChange={(e) => setEditedCase({ ...editedCase, pet_story: e.target.value })}
                    rows={6}
                    className="bg-[#f3f3f5] border-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Donations */}
            <Card className="bg-white border-[#e2e8f0]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Donations</CardTitle>
                  <Button 
                    onClick={() => setShowDonationForm(!showDonationForm)}
                    size="sm"
                    className="bg-[#155dfc] hover:bg-[#1447e6] gap-2"
                  >
                    <Plus className="size-4" />
                    Log New Donation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showDonationForm && (
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-medium text-[#0f172b] mb-4">Log New Donation</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="donation-amount">Donation Amount *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555] text-sm font-medium pointer-events-none z-10">
                            AED
                          </span>
                          <Input
                            id="donation-amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newDonation.amount}
                            onChange={(e) => setNewDonation({ ...newDonation, amount: e.target.value })}
                            className="pl-14 bg-[#f6f6f6] border-[#e5e5e5]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="donor-name">Donor Name (Optional)</Label>
                        <Input
                          id="donor-name"
                          placeholder="Defaults to Anonymous if empty"
                          value={newDonation.donor_name}
                          onChange={(e) => setNewDonation({ ...newDonation, donor_name: e.target.value })}
                          className="bg-[#f6f6f6] border-[#e5e5e5]"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowDonationForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddDonation}
                          className="flex-1 bg-[#4e95ff] hover:bg-[#3b82f6]"
                        >
                          Add Donation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {donations.map((donation) => (
                    <div 
                      key={donation.id}
                      className="flex items-center justify-between p-3 border border-[#e2e8f0] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-[15px] text-[#0f172b] font-medium">
                          {donation.donor_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-[#45556c]">
                          {formatDate(donation.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-[17px] font-semibold text-[#16a34a]">
                          AED {donation.amount.toLocaleString()}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDonation(donation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {donations.length === 0 && !showDonationForm && (
                    <p className="text-sm text-[#64748b] text-center py-4">
                      No donations yet. Click "Log New Donation" to add one.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Links & Documents */}
            <Card className="bg-white border-[#e2e8f0]">
              <CardHeader>
                <CardTitle className="text-xl">Links & Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-link">Vet Payment Link *</Label>
                  <Input
                    id="payment-link"
                    value={editedCase.payment_link}
                    onChange={(e) => setEditedCase({ ...editedCase, payment_link: e.target.value })}
                    className="bg-[#f3f3f5] border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Social Media Link</Label>
                  <Input
                    id="instagram"
                    value={editedCase.instagram_link}
                    onChange={(e) => setEditedCase({ ...editedCase, instagram_link: e.target.value })}
                    className="bg-[#f3f3f5] border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-file">Invoice Documents (Optional - Multiple Files)</Label>
                  <div className="relative">
                    <input
                      id="invoice-file"
                      type="file"
                      accept="application/pdf,image/*"
                      multiple
                      onChange={handleInvoiceUpload}
                      disabled={isUploadingInvoices}
                      className="hidden"
                    />
                    <label 
                      htmlFor="invoice-file"
                      className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isUploadingInvoices 
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {isUploadingInvoices ? (
                        <>
                          <Loader2 className="size-5 text-gray-600 animate-spin" />
                          <span className="text-sm text-gray-600">Uploading invoices...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="size-5 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            {invoiceFiles.length > 0 
                              ? `${invoiceFiles.length} file(s) selected - Click to add more` 
                              : 'Click to upload invoices (PDF/Image)'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Current Invoice */}
                  {pet.invoice_file && invoiceFiles.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#0f172b]">Current Invoice:</p>
                      <div className="flex items-center justify-between p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc]">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-[#155dfc]" />
                          <a 
                            href={pet.invoice_file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-[#155dfc] hover:underline"
                          >
                            {pet.invoice_file.split('/').pop()}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Invoice Files List */}
                  {invoiceFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#0f172b]">New Invoices to Upload:</p>
                      {invoiceFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc]">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-[#155dfc]" />
                            <span className="text-sm text-[#45556c]">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInvoiceFile(index)}
                            className="text-red-600 hover:text-red-700"
                            disabled={isUploadingInvoices}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Financial Summary */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card className="bg-white border-[#e2e8f0]">
              <CardHeader>
                <CardTitle className="text-xl">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-[#45556c]">Total Debt:</span>
                    <span className="text-[#0f172b] font-semibold whitespace-nowrap">
                      AED {parseFloat(editedCase.estimated_cost || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-[#45556c]">Amount Paid:</span>
                    <span className="text-[#16a34a] font-semibold whitespace-nowrap">
                      AED {totalDonated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-[#e2e8f0] gap-2">
                    <span className="text-[#0f172b] font-medium">Remaining:</span>
                    <span className="text-[#155dfc] font-bold whitespace-nowrap">
                      AED {(remaining > 0 ? remaining : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#45556c]">Progress</span>
                    <span className="text-xs font-semibold text-[#0f172b]">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-[#e2e8f0] rounded-full h-3">
                    <div
                      className="bg-[#155dfc] h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleSave}
                disabled={isSaving || isUploadingInvoices}
                className="w-full bg-[#155dfc] hover:bg-[#1447e6] h-11 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving || isUploadingInvoices ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isUploadingInvoices ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button 
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-11 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Delete Case
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
