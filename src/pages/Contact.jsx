import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import { Mail, Phone, MapPin, MessageSquare, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/config/api";

const contactChannels = [
  {
    title: "Email",
    value: "support@mapmyparty.com",
    icon: Mail,
    desc: "We respond within 1 business day.",
  },
  {
    title: "Phone / WhatsApp",
    value: "+91 879-619-2111",
    icon: Phone,
    desc: "Support hours: 9 AM - 9 PM IST",
  },
  {
    title: "Our Office",
    value: "Saket, New Delhi - India",
    icon: MapPin,
    desc: "MomentumX Media Pvt. Ltd.",
  },
];

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
};

const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;

const validateField = (fieldName, value) => {
  const trimmedValue = value.trim();

  switch (fieldName) {
    case "fullName":
      if (!trimmedValue) return "Full name is required.";
      if (trimmedValue.length < 2) return "Full name must be at least 2 characters.";
      if (!/^[a-zA-Z\s.'-]+$/.test(trimmedValue)) return "Enter a valid full name.";
      return "";
    case "email":
      if (!trimmedValue) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) return "Enter a valid email address.";
      return "";
    case "phone":
      if (!trimmedValue) return "Phone number is required.";
      if (!/^\d{10}$/.test(trimmedValue)) return "Phone number must be exactly 10 digits.";
      return "";
    case "topic":
      if (!trimmedValue) return "Topic is required.";
      if (countWords(trimmedValue) > 20) return "Topic cannot exceed 20 words.";
      return "";
    case "message":
      if (!trimmedValue) return "Message is required.";
      if (trimmedValue.length < 10) return "Message must be at least 10 characters.";
      return "";
    default:
      return "";
  }
};

const Contact = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "topic") {
      const words = value.trim().split(/\s+/).filter(Boolean);
      nextValue = words.length > 20 ? words.slice(0, 20).join(" ") : value;
    }

    setFormData((currentData) => ({
      ...currentData,
      [name]: nextValue,
    }));

    if (touchedFields[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: validateField(name, nextValue),
      }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouchedFields((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextTouchedFields = Object.keys(formData).reduce((accumulator, fieldName) => {
      accumulator[fieldName] = true;
      return accumulator;
    }, {});

    const nextErrors = Object.entries(formData).reduce((accumulator, [fieldName, value]) => {
      accumulator[fieldName] = validateField(fieldName, value);
      return accumulator;
    }, {});

    setTouchedFields(nextTouchedFields);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      setIsSubmitting(true);

      await apiFetch("contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setFormData(initialFormData);
      setErrors({});
      setTouchedFields({});
      toast.success("Your message has been sent successfully. Our team will contact you shortly.");
    } catch (error) {
      toast.error(error?.message || "Unable to send your message right now. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClassName = (fieldName) =>
    errors[fieldName] && touchedFields[fieldName]
      ? "border-red-400/80 bg-slate-950/40 text-white focus-visible:ring-red-300"
      : "border-white/15 bg-slate-950/40 text-white";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Header forceMainHeader />

      <section className="relative overflow-hidden bg-[#140a2b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,105,180,0.28),transparent_45%),radial-gradient(circle_at_65%_25%,rgba(122,78,255,0.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,183,104,0.25),transparent_40%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0619] via-[#1b0c2f] to-[#31154a] opacity-90" />
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-16 top-16 h-3 w-3 rounded-full bg-pink-300/70 blur-sm" />
          <div className="absolute left-40 top-28 h-2 w-2 rounded-full bg-purple-200/70 blur-sm" />
          <div className="absolute right-20 top-20 h-4 w-4 rounded-full bg-fuchsia-300/70 blur-sm" />
          <div className="absolute right-36 bottom-24 h-3 w-3 rounded-full bg-rose-200/80 blur-sm" />
          <div className="absolute left-1/2 bottom-14 h-2 w-2 rounded-full bg-amber-200/80 blur-sm" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-200/70">Contact</p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Talk to a real human. We're here to help your event shine.
            </h1>
            <p className="max-w-2xl text-lg text-slate-200/80">
              Whether you're hosting, attending, or partnering, our concierge support team responds fast and with care.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>
                Chat with us
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-slate-900">
                Book a call
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
          {contactChannels.map(({ title, value, icon: Icon, desc }) => (
            <Card
              key={title}
              className="h-full min-h-[196px] border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.65)]"
            >
              <CardContent className="flex h-full flex-col items-start justify-between p-6">
                <div className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-pink-200 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold leading-tight text-white">{title}</h2>
                    <p className="text-sm leading-6 text-slate-300/75">{desc}</p>
                  </div>
                </div>
                <p className="pt-5 text-base font-semibold leading-6 text-white md:text-[17px]">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-400/10 via-rose-400/10 to-blue-400/10 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl md:grid-cols-5 md:p-10">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-slate-200/75">
                <Clock className="h-4 w-4" />
                <span>Avg. response time: under 2 hours</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Send us a note</h2>
              <p className="text-slate-200/80">
                Share a few details and we'll follow up with exactly what you need - no bots, no fluff.
              </p>
              <ul className="space-y-2 text-sm text-slate-200/75">
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-200" />
                  Event setup & onboarding
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-200" />
                  Ticketing, payouts, and refunds
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-200" />
                  Partnerships & media
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <form className="space-y-4" noValidate onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-full-name" className="text-sm text-slate-200/75">Full Name</label>
                    <Input
                      id="contact-full-name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Your name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={80}
                      pattern="[A-Za-z\s.'-]+"
                      aria-invalid={Boolean(errors.fullName && touchedFields.fullName)}
                      aria-describedby={errors.fullName && touchedFields.fullName ? "contact-full-name-error" : undefined}
                      className={getFieldClassName("fullName")}
                    />
                    {errors.fullName && touchedFields.fullName ? (
                      <p id="contact-full-name-error" className="mt-2 text-xs text-red-200">
                        {errors.fullName}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="text-sm text-slate-200/75">Email</label>
                    <Input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      required
                      maxLength={120}
                      aria-invalid={Boolean(errors.email && touchedFields.email)}
                      aria-describedby={errors.email && touchedFields.email ? "contact-email-error" : undefined}
                      className={getFieldClassName("email")}
                    />
                    {errors.email && touchedFields.email ? (
                      <p id="contact-email-error" className="mt-2 text-xs text-red-200">
                        {errors.email}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-phone" className="text-sm text-slate-200/75">Phone</label>
                    <Input
                      id="contact-phone"
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="9876543210"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      required
                      minLength={10}
                      maxLength={10}
                      pattern="\d{10}"
                      aria-invalid={Boolean(errors.phone && touchedFields.phone)}
                      aria-describedby={errors.phone && touchedFields.phone ? "contact-phone-error" : undefined}
                      className={getFieldClassName("phone")}
                    />
                    {errors.phone && touchedFields.phone ? (
                      <p id="contact-phone-error" className="mt-2 text-xs text-red-200">
                        {errors.phone}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="contact-topic" className="text-sm text-slate-200/75">Topic</label>
                    <Input
                      id="contact-topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Ticketing, hosting, partnership..."
                      required
                      maxLength={200}
                      aria-invalid={Boolean(errors.topic && touchedFields.topic)}
                      aria-describedby={errors.topic && touchedFields.topic ? "contact-topic-error" : undefined}
                      className={getFieldClassName("topic")}
                    />
                    {errors.topic && touchedFields.topic ? (
                      <p id="contact-topic-error" className="mt-2 text-xs text-red-200">
                        {errors.topic}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" className="text-sm text-slate-200/75">Message</label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={4}
                    placeholder="Tell us a bit more so we can help fast."
                    required
                    minLength={10}
                    maxLength={1000}
                    aria-invalid={Boolean(errors.message && touchedFields.message)}
                    aria-describedby={errors.message && touchedFields.message ? "contact-message-error" : undefined}
                    className={getFieldClassName("message")}
                  />
                  {errors.message && touchedFields.message ? (
                    <p id="contact-message-error" className="mt-2 text-xs text-red-200">
                      {errors.message}
                    </p>
                  ) : null}
                </div>
                <Button type="submit" className="w-full gap-2 md:w-auto" disabled={isSubmitting}>
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
                <p className="text-xs text-slate-200/70">By submitting, you agree to our Terms and Privacy Policy.</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
