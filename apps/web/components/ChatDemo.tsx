"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="chat-section" ref={ref}>
      {/* Mascots */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/site-imgs/mascot-red.png"
        alt=""
        className={`mascot red${visible ? " visible" : ""}`}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/site-imgs/mascot-grey.png"
        alt=""
        className={`mascot grey${visible ? " visible" : ""}`}
        aria-hidden
      />

      <div className="chat-wrap">

        <div className="msg user">
          <div className="bubble">she matched me on hinge but her replies are one word. do i keep going?</div>
          <div className="msg-meta">
            <img src="https://i.pravatar.cc/100?img=11" alt="user" />
            <span>Marcus · 9:41 PM</span>
          </div>
        </div>

        <div className="msg kupi">
          <div className="bubble">one-word replies can go either way — she might be testing you or just bad at texting. don&apos;t double text. ask something she actually has to answer.</div>
          <div className="msg-meta">
            <span>9:42 PM · KUPI</span>
            <img src="/profile.png" alt="KUPI" />
          </div>
        </div>

        <div className="msg user">
          <div className="bubble">ok here&apos;s the screenshot</div>
          <div className="msg-meta">
            <img src="https://i.pravatar.cc/100?img=11" alt="user" />
            <span>Marcus · 9:43 PM</span>
          </div>
        </div>

        <div className="msg kupi">
          <div className="bubble">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site-imgs/Heart.png" alt="❤️" className="react-badge" />
            Sofia read: 72/100 interest.<br /><br />
            Best moves:<br /><br />
            1. &quot;Okay I see you. Settle a debate — coffee date or first drink?&quot;<br /><br />
            2. &quot;You give off chaotic good energy. Am I wrong?&quot;<br /><br />
            3. &quot;Last thing that genuinely surprised you?&quot;
          </div>
          <div className="msg-meta">
            <span>9:44 PM · KUPI</span>
            <img src="/profile.png" alt="KUPI" />
          </div>
        </div>

        <div className="msg user">
          <div className="bubble">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site-imgs/ThumbsUp.png" alt="👍" className="react-badge" style={{ left: "auto", right: -12 }} />
            she replied!! this actually worked 🤩
          </div>
          <div className="msg-meta">
            <img src="https://i.pravatar.cc/100?img=11" alt="user" />
            <span>Marcus · 10:02 PM</span>
          </div>
        </div>

        <div className="msg kupi">
          <div className="bubble">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site-imgs/Haha.png" alt="haha" className="react-badge" />
            damn bruh, told you. keep the energy up — mirror whatever she gives you, stay curious.
          </div>
          <div className="msg-meta">
            <span>10:03 PM · KUPI</span>
            <img src="/profile.png" alt="KUPI" />
          </div>
        </div>

      </div>
    </div>
  );
}
