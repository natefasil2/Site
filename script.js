(function () {
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", function () {
      const open = navLinks.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
  }

  const carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    const wrapper = carousel.querySelector(".carousel-track-wrapper");
    const track = carousel.querySelector(".carousel-track");
    const prevBtn = carousel.querySelector(".carousel-btn.prev");
    const nextBtn = carousel.querySelector(".carousel-btn.next");
    const originalCards = Array.from(track.children);
    let cards = originalCards.slice();
    let offset = 0;
    let loopWidth = 0;
    let animationFrame = null;
    let lastTime = 0;
    let activeCard = null;
    const speed = 48;

    function hideArrows() {
      [prevBtn, nextBtn].forEach(function (button) {
        if (!button) {
          return;
        }
        button.hidden = true;
        button.setAttribute("aria-hidden", "true");
        button.tabIndex = -1;
      });
    }

    function getTrackGap() {
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || "0");
      return Number.isNaN(gap) ? 0 : gap;
    }

    function measure() {
      if (!cards.length) {
        loopWidth = 0;
        return;
      }
      const cardWidth = cards[0].getBoundingClientRect().width;
      loopWidth = (cardWidth + getTrackGap()) * originalCards.length;
    }

    function updateCenterCard() {
      if (!wrapper || !cards.length) {
        return;
      }
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
      let closest = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach(function (card) {
        const rect = card.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const distance = Math.abs(center - wrapperCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = card;
        }
      });

      if (activeCard && activeCard !== closest) {
        activeCard.classList.remove("is-center");
      }
      if (closest && closest !== activeCard) {
        closest.classList.add("is-center");
      }
      activeCard = closest;
    }

    function render() {
      track.style.transform = "translateX(-" + offset + "px)";
      updateCenterCard();
    }

    function tick(timestamp) {
      if (!lastTime) {
        lastTime = timestamp;
      }
      const deltaSeconds = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (loopWidth > 0) {
        offset += speed * deltaSeconds;
        if (offset >= loopWidth) {
          offset -= loopWidth;
        }
        render();
      }

      animationFrame = window.requestAnimationFrame(tick);
    }

    if (wrapper && track && originalCards.length) {
      hideArrows();

      originalCards.forEach(function (card) {
        track.appendChild(card.cloneNode(true));
      });
      cards = Array.from(track.children);

      measure();
      render();
      animationFrame = window.requestAnimationFrame(tick);

      window.addEventListener("resize", function () {
        const ratio = loopWidth > 0 ? offset / loopWidth : 0;
        measure();
        offset = ratio * loopWidth;
        render();
      });

      window.addEventListener("beforeunload", function () {
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
        }
      });
    }
  }

  const testimonialRoot = document.querySelector("[data-testimonials]");
  if (testimonialRoot) {
    const testimonials = Array.from(
      testimonialRoot.querySelectorAll(".testimonial"),
    );
    const dots = Array.from(testimonialRoot.querySelectorAll(".dot"));
    const prev = testimonialRoot.querySelector(".t-btn.prev");
    const next = testimonialRoot.querySelector(".t-btn.next");
    let active = 0;
    let startX = 0;

    function render(index) {
      testimonials.forEach(function (card, i) {
        card.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function step(direction) {
      active = (active + direction + testimonials.length) % testimonials.length;
      render(active);
    }

    prev.addEventListener("click", function () {
      step(-1);
    });

    next.addEventListener("click", function () {
      step(1);
    });

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        active = index;
        render(active);
      });
    });

    testimonialRoot.addEventListener("touchstart", function (event) {
      startX = event.changedTouches[0].clientX;
    });

    testimonialRoot.addEventListener("touchend", function (event) {
      const endX = event.changedTouches[0].clientX;
      const diff = endX - startX;
      if (Math.abs(diff) > 35) {
        if (diff < 0) {
          step(1);
        } else {
          step(-1);
        }
      }
    });
  }

  const quoteForm = document.querySelector("#quote-form");
  if (quoteForm) {
    quoteForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const name = quoteForm.querySelector("#name").value.trim();
      const email = quoteForm.querySelector("#email").value.trim();
      const service = quoteForm.querySelector("#service").value.trim();
      const message = quoteForm.querySelector("#message").value.trim();
      const submitButton = quoteForm.querySelector("button[type='submit']");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("service", service);
        formData.append("message", message);
        formData.append(
          "_subject",
          "Print Request: " + (service || "General Inquiry"),
        );
        formData.append("_replyto", email);
        formData.append("_captcha", "false");
        formData.append("_template", "table");

        const response = await fetch(
          "https://formsubmit.co/ajax/natefasil4@gmail.com",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error("Request failed with status " + response.status);
        }

        const result = await response.json().catch(function () {
          return {};
        });
        const isSuccess = result.success === "true" || result.success === true;
        if (!isSuccess) {
          const serverMessage =
            typeof result.message === "string" && result.message.trim()
              ? result.message.trim()
              : "Form service rejected the request.";
          throw new Error(serverMessage);
        }

        alert("Request sent successfully.");
        quoteForm.reset();
      } catch (error) {
        console.error("Form submission error:", error);
        alert("Unable to send request: " + error.message);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Send Request";
        }
      }
    });
  }
})();
