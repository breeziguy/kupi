import Link from "next/link";
import Image from "next/image";
import ChatDemo from "@/components/ChatDemo";

export default function LandingPage() {
  return (
    <div className="page-wrap">

      {/* Hero */}
      <Image
        src="/hero.png"
        alt="KUPI — your iMessage wingman"
        width={560}
        height={560}
        className="hero-img"
        style={{ width: "100%", height: "auto" }}
        priority
      />

      <h1 className="heading-xl">
        With Great Rizz<br />comes Connections
      </h1>

      <p className="label-sm">Works with screenshots from</p>
      <div className="platforms">
        <span>Tinder</span>
        <span>Hinge</span>
        <span>Instagram</span>
        <span>WhatsApp</span>
        <span>Bumble</span>
      </div>

      <Link href="/onboard" className="btn-primary cta">START FREE →</Link>

      <p className="body-muted">
        Send KUPI a screenshot and get the read, the rizz score, and exactly what to text next — all inside iMessage. No app download needed.
      </p>

      {/* Chat demo with mascots */}
      <ChatDemo />

      {/* Reviews */}
      <div className="reviews-wrap">
        <div className="review-card">
          <div className="review-head">
            <img src="https://i.pravatar.cc/150?img=68" alt="AJ" className="review-avatar" />
            <div className="review-name">AJ ✓</div>
          </div>
          <div className="review-text">kupi told me exactly what to say and she said yes to the date. this thing is cold</div>
        </div>

        <div className="review-card">
          <div className="review-head">
            <img src="https://i.pravatar.cc/150?img=32" alt="Priya" className="review-avatar" />
            <div className="review-name">Priya S ✓</div>
          </div>
          <div className="review-text">as a girl i use this to see how guys are reading my texts lmao. it&apos;s frighteningly accurate</div>
        </div>

        <div className="review-card">
          <div className="review-head">
            <img src="https://i.pravatar.cc/150?img=44" alt="Tom" className="review-avatar" />
            <div className="review-name">Tom W ✓</div>
          </div>
          <div className="review-text">the rizz report after the screenshot is insane. it caught a red flag i completely missed</div>
        </div>

        <div className="review-card">
          <div className="review-head">
            <img src="https://i.pravatar.cc/150?img=59" alt="Destiny" className="review-avatar" />
            <div className="review-name">Destiny M ✓</div>
          </div>
          <div className="review-text">i&apos;ve tried every dating app and nothing ever helped me actually text better. kupi just gets it</div>
        </div>

        <div className="review-card">
          <div className="review-head">
            <img src="https://i.pravatar.cc/150?img=12" alt="Kyle" className="review-avatar" />
            <div className="review-name">Kyle R ✓</div>
          </div>
          <div className="review-text">matched, texted, she asked me out first. i have never done anything. kupi did this.</div>
        </div>

        <div className="reviews-fade" />
      </div>

      <div className="faded-quote">
        &quot;this is genuinely the funniest and most useful thing i&apos;ve used this year&quot;
      </div>

      <svg className="deco" width="30" height="60" viewBox="0 0 30 60" fill="none" strokeWidth="1.5">
        <path d="M15,0 C15,20 0,30 15,40 C30,50 15,60 15,60" />
      </svg>

      {/* How it works */}
      <div className="card">
        <h2 className="heading-md">How KUPI works</h2>
        <div className="process-item">
          <div className="process-num">1</div>
          <div className="process-text">
            <h3>Sign up in 30 seconds</h3>
            <p>Enter your name and number. Tap the link and you&apos;re in iMessage with KUPI — no app download, no login screen.</p>
          </div>
        </div>
        <div className="process-item">
          <div className="process-num">2</div>
          <div className="process-text">
            <h3>Send a screenshot</h3>
            <p>Drop any chat screenshot — Tinder, Hinge, Instagram, WhatsApp. KUPI reads the conversation and gives you the honest vibe.</p>
          </div>
        </div>
        <div className="process-item">
          <div className="process-num">3</div>
          <div className="process-text">
            <h3>Get the reply + the read</h3>
            <p>Three real reply options, an interest score, green flags, red flags — and KUPI remembers everything for next time.</p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="pricing-card">
        <div className="pricing-rows">
          <div className="pricing-row active">
            <span>Free Trial</span>
            <span><span className="price-val">7 days</span><span className="price-sub"> free</span></span>
          </div>
          <div className="pricing-row">
            <span>Basic</span>
            <span><span className="price-val">$9.99</span><span className="price-sub">/month</span></span>
          </div>
          <div className="pricing-row">
            <span>Pro</span>
            <span><span className="price-val">$19.99</span><span className="price-sub">/month</span></span>
          </div>
        </div>
        <div className="pricing-desc">Everything you need to stop overthinking and start winning.</div>
        <ul className="features-list">
          <li><span className="check">✓</span> Screenshot analysis — Tinder, Hinge, Instagram, WhatsApp</li>
          <li><span className="check">✓</span> 3 personalised reply options per conversation</li>
          <li><span className="check">✓</span> Interest level + compatibility tracking</li>
          <li><span className="check">✓</span> Red flag + green flag detection</li>
          <li><span className="check">✓</span> KUPI remembers your style and their patterns</li>
          <li><span className="check">✓</span> All inside iMessage — no app needed</li>
        </ul>
        <Link href="/onboard" className="btn-white">Start Free Trial →</Link>
      </div>

      <footer>© 2025 KUPI. All rights reserved.</footer>
    </div>
  );
}
