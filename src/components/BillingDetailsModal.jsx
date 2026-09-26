import IndiaLocationFields from "@/components/IndiaLocationFields";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PHONE_INPUT_PROPS,
  normalizeTenDigitPhoneNumber,
  sanitizeTenDigitPhoneInput,
} from "@/utils/phone";

const BillingDetailsModal = ({ isOpen, onClose, onSubmit, isLoading, user }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Pre-fill user data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: user?.name || "",
        email: user?.email || "",
        phone: sanitizeTenDigitPhoneInput(user?.phone || ""),
        addressLine1: user?.addressLine1 || "",
        addressLine2: user?.addressLine2 || "",
        city: user?.city || "",
        state: user?.state || "",
        pincode: user?.pincode || "",
      });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? sanitizeTenDigitPhoneInput(value)
        : name === "pincode" ? value.replace(/\D/g, "").slice(0, 6) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.addressLine1.trim()) {
      toast.error("Please enter your address");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("Please select your city");
      return;
    }
    if (!formData.state.trim()) {
      toast.error("Please select your state");
      return;
    }
    if (!formData.pincode.trim()) {
      toast.error("Please enter your pincode");
      return;
    }

    // Validate phone number
    const phoneDigits = normalizeTenDigitPhoneNumber(formData.phone);
    if (!phoneDigits) {
      toast.error("Please enter a valid phone number (10 digits)");
      return;
    }

    // Validate pincode
    if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit Indian pincode");
      return;
    }

    onSubmit({
      ...formData,
      phone: phoneDigits,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#0b1220] to-[#0a0f1a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Billing Details</DialogTitle>
          <DialogDescription className="text-white/70">
            Please provide your billing information for the booking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-white/80">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white/80">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-white/80">
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                {...PHONE_INPUT_PROPS}
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
                required
              />
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Billing Address
            </h3>

            <div>
              <Label htmlFor="addressLine1" className="text-white/80">
                Address Line 1 *
              </Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Street address, P.O. box"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
                required
              />
            </div>

            <div>
              <Label htmlFor="addressLine2" className="text-white/80">
                Address Line 2 (Optional)
              </Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Apartment, suite, unit, building, floor, etc."
                className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <IndiaLocationFields idPrefix="billing" state={formData.state} city={formData.city}
                onChange={(location) => setFormData((current) => ({ ...current, ...location }))}
                required disabled={isLoading} className="bg-white/5 border-white/20 text-white" />

              <div>
                <Label htmlFor="pincode" className="text-white/80">
                  Pincode *
                </Label>
                <Input
                  id="pincode"
                  name="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[1-9][0-9]{5}"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDetailsModal;
