import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Nav from "@/components/Nav";
import ScrollFx from "@/components/ScrollFx";
import {
  clients,
  process,
  projects,
  services,
  site,
  stats,
  testimonials,
} from "@/data/site";

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 13 13 3M5 3h8v8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <Nav />

      <main id="top">
        <Hero />

        <section className="clients" aria-label="Selected clients">
          <Marquee items={clients} />
        </section>

        <section className="section" id="work">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              Selected work
            </p>
            <h2 data-split>
              Websites that <em>earn their keep.</em>
            </h2>
          </div>
          <div className="work-grid">
            {projects.map((project, i) => (
              <a href={project.href} className="work-card" key={project.name} data-reveal>
                <div className={`work-art work-art-${(i % 4) + 1}`}>
                  <div className="work-art-inner" data-parallax="0.1" />
                  <span className="work-result">{project.result}</span>
                </div>
                <div className="work-meta">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.category}</p>
                  </div>
                  <span className="work-year">{project.year}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              Services
            </p>
            <h2 data-split>
              Everything a premium website needs, <em>under one roof.</em>
            </h2>
          </div>
          <ul className="service-list">
            {services.map((service, i) => (
              <li key={service.title} className="service" data-reveal>
                <span className="rule" data-line />
                <span className="service-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <ul className="tags">
                  {service.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="stats" aria-label="Results">
          <span className="rule" data-line />
          <div className="stats-grid" data-reveal-group>
            {stats.map((stat) => (
              <div className="stat" key={stat.label}>
                <strong data-count={stat.value}>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <span className="rule" data-line />
        </section>

        <section className="section" id="process">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              Process
            </p>
            <h2 data-split>
              Four steps from first call to <em>launch day.</em>
            </h2>
          </div>
          <ol className="process" data-reveal-group>
            {process.map((step, i) => (
              <li key={step.title}>
                <span className="rule rule-accent" data-line />
                <span className="process-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" id="clients">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              Clients
            </p>
            <h2 data-split>
              What it is like to <em>work with us.</em>
            </h2>
          </div>
          <div className="quotes" data-reveal-group>
            {testimonials.map((item) => (
              <figure className="quote" key={item.name}>
                <blockquote>{item.quote}</blockquote>
                <figcaption>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="wordmark" aria-label={site.name}>
          <div className="wordmark-img" data-wordmark>
            <Image src="/creovia-wordmark-dark.png" alt={site.name} width={1020} height={170} />
          </div>
          <p data-reveal>{site.tagline}</p>
        </section>

        <section className="section contact" id="contact">
          <div className="contact-copy">
            <p className="eyebrow" data-reveal>
              Contact
            </p>
            <h2 data-split>
              Let&rsquo;s build a website <em>worth visiting.</em>
            </h2>
            <p data-reveal>
              Tell us where you want to go. We reply to every enquiry within one working day.
            </p>
            <dl data-reveal-group>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{site.phone}</dd>
              </div>
              <div>
                <dt>Studio</dt>
                <dd>{site.location}</dd>
              </div>
            </dl>
          </div>
          <div data-reveal>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <Image src="/creovia-mark-dark.png" alt="" width={450} height={295} className="footer-mark" />
        <ul>
          {site.socials.map((social) => (
            <li key={social.label}>
              <a href={social.href}>{social.label}</a>
            </li>
          ))}
        </ul>
        <p>
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
        <a href="#top" className="footer-top">
          Back to top
          <Arrow />
        </a>
      </footer>

      <ScrollFx />
    </>
  );
}
