import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit2, Save, X, CreditCard, DollarSign } from "lucide-react";

const OrganizerProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentEditData, setPaymentEditData] = useState(null);
  const [user, setUser] = useState({
    name: "Organizer",
    email: "",
    phone: "+91 9876543210",
    location: "Mumbai, India",
    state: "Maharashtra",
    joinDate: "January 2024",
    bio: "Professional event organizer with 5+ years of experience",
    paymentDetails: {
      bankAccountHolder: "John Doe",
      bankName: "HDFC Bank",
      accountNumber: "****1234",
      ifscCode: "HDFC0001234",
      upiId: "organizer@upi",
      totalTicketSales: "₹5,24,000",
      pendingPayment: "₹45,000",
      lastPaymentDate: "28 Nov 2024",
    },
  });

  const [editData, setEditData] = useState(user);

  useEffect(() => {
    try {
      const profileRaw = sessionStorage.getItem("userProfile");
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const name = sessionStorage.getItem("userName") || profile.name || "Organizer";
      const email = sessionStorage.getItem("userEmail") || profile.email || "";
      setUser((prev) => ({ ...prev, name, email }));
      setEditData((prev) => ({ ...prev, name, email }));
    } catch {}
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(user);
  };

  const handleSave = () => {
    setUser(editData);
    setIsEditing(false);
    // You can add API call here to save the profile
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(user);
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditPayment = () => {
    setPaymentEditData({ ...user.paymentDetails });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = () => {
    setUser((prev) => ({
      ...prev,
      paymentDetails: paymentEditData,
    }));
    setIsPaymentModalOpen(false);
    setPaymentEditData(null);
  };

  const handleCancelPayment = () => {
    setIsPaymentModalOpen(false);
    setPaymentEditData(null);
  };

  const handlePaymentInputChange = (field, value) => {
    setPaymentEditData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Organizer Profile</h1>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-primaryCTA text-primary-foreground rounded-lg hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Profile Header Section */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-red-600 font-bold text-4xl shadow-lg">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="text-white">
                <h2 className="text-3xl font-bold">{user.name || "Organizer"}</h2>
                <p className="text-red-100 mt-1">Event Organizer</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            {!isEditing ? (
              // View Mode
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="text-base font-medium text-gray-900 mt-1">
                          {user.email || "organizer@example.com"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="text-base font-medium text-gray-900 mt-1">{user.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & Date */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-base font-medium text-gray-900 mt-1">{user.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">State</p>
                        <p className="text-base font-medium text-gray-900 mt-1">{user.state}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-base font-medium text-gray-900 mt-1">{user.joinDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {user.bio}
                  </p>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Events</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Attendees</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">2.5K</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">₹5.2L</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  
                  {/* Payment Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-gray-600">Total Ticket Sales</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{user.paymentDetails.totalTicketSales}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-gray-600">Pending Payment</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{user.paymentDetails.pendingPayment}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-gray-600">Last Payment</p>
                      </div>
                      <p className="text-sm font-bold text-blue-600">{user.paymentDetails.lastPaymentDate}</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-red-600" />
                        Bank Account Details
                      </h4>
                      <button
                        onClick={handleEditPayment}
                        className="flex items-center gap-2 px-3 py-1 bg-primaryCTA text-primary-foreground rounded-lg hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition-colors text-sm font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Account Holder Name</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{user.paymentDetails.bankAccountHolder}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Bank Name</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{user.paymentDetails.bankName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Account Number</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{user.paymentDetails.accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">IFSC Code</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{user.paymentDetails.ifscCode}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase font-medium">UPI ID</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{user.paymentDetails.upiId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={editData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                {/* Payment Details Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-600" />
                    Payment Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        value={editData.paymentDetails?.bankAccountHolder || ""}
                        onChange={(e) => setEditData((prev) => ({
                          ...prev,
                          paymentDetails: { ...prev.paymentDetails, bankAccountHolder: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={editData.paymentDetails?.bankName || ""}
                        onChange={(e) => setEditData((prev) => ({
                          ...prev,
                          paymentDetails: { ...prev.paymentDetails, bankName: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={editData.paymentDetails?.accountNumber || ""}
                        onChange={(e) => setEditData((prev) => ({
                          ...prev,
                          paymentDetails: { ...prev.paymentDetails, accountNumber: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                      <input
                        type="text"
                        value={editData.paymentDetails?.ifscCode || ""}
                        onChange={(e) => setEditData((prev) => ({
                          ...prev,
                          paymentDetails: { ...prev.paymentDetails, ifscCode: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                      <input
                        type="text"
                        value={editData.paymentDetails?.upiId || ""}
                        onChange={(e) => setEditData((prev) => ({
                          ...prev,
                          paymentDetails: { ...prev.paymentDetails, upiId: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Edit Mode Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primaryCTA text-primary-foreground rounded-lg hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition-colors font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {isPaymentModalOpen && paymentEditData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-600" />
                Edit Bank Details
              </h2>
              <button
                onClick={handleCancelPayment}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={paymentEditData.bankAccountHolder || ""}
                  onChange={(e) => handlePaymentInputChange("bankAccountHolder", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={paymentEditData.bankName || ""}
                  onChange={(e) => handlePaymentInputChange("bankName", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={paymentEditData.accountNumber || ""}
                  onChange={(e) => handlePaymentInputChange("accountNumber", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                <input
                  type="text"
                  value={paymentEditData.ifscCode || ""}
                  onChange={(e) => handlePaymentInputChange("ifscCode", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                <input
                  type="text"
                  value={paymentEditData.upiId || ""}
                  onChange={(e) => handlePaymentInputChange("upiId", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleSavePayment}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primaryCTA text-primary-foreground rounded-lg hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancelPayment}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerProfile;
