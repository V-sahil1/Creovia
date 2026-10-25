"use client";

import type { FormEvent } from "react";
import { site } from "@/data/site";

// No backend yet: submitting opens the visitor's mail app with the brief filled in.
export default function ContactForm() {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = `New project enquiry from ${data.get("name")}`;
    const body = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Budget: ${data.get("budget")}`,
      "",
      `${data.get("message")}`,
    ].join("\n");
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <label>
        <span>Your name</span>
        <input name="name" type="text" autoComplete="name" required />
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>Budget</span>
        <select name="budget" defaultValue="Not sure yet">
          <option>Not sure yet</option>
          <option>Under $5k</option>
          <option>$5k – $15k</option>
          <option>$15k – $40k</option>
          <option>$40k+</option>
        </select>
      </label>
      <label>
        <span>Tell us about the project</span>
        <textarea name="message" rows={4} required />
      </label>
      <button type="submit" className="btn btn-primary">
        Send enquiry
      </button>
    </form>
  );
}
