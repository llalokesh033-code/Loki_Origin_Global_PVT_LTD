(function(){
	const menuWrapper = document.querySelector('.menu-wrapper');
	const menuToggle = document.querySelector('.menu-toggle');
	const menuDropdown = document.querySelector('.menu-dropdown');
	const currentYear = document.querySelector('#current-year');
	const bookingForm = document.querySelector('#booking-form');
	const bookingStatus = document.querySelector('#booking-status');
	const destinationCountry = document.querySelector('#destination-country');
	const preferredDate = document.querySelector('#preferred-date');

	if (currentYear) currentYear.textContent = new Date().getFullYear();

	if (menuWrapper && menuToggle && menuDropdown) {
		const closeMenu = () => {
			menuWrapper.classList.remove('open');
			menuToggle.setAttribute('aria-expanded', 'false');
		};

		menuToggle.addEventListener('click', (event) => {
			event.stopPropagation();
			const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
			menuWrapper.classList.toggle('open', !expanded);
			menuToggle.setAttribute('aria-expanded', String(!expanded));
		});

		document.addEventListener('click', (event) => {
			if (!menuWrapper.contains(event.target)) closeMenu();
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeMenu();
				menuToggle.focus();
			}
		});

		menuToggle.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				menuWrapper.classList.add('open');
				menuToggle.setAttribute('aria-expanded', 'true');
				const firstItem = menuDropdown.querySelector('.menu-link');
				if (firstItem) firstItem.focus();
			}
		});
	}

	if (bookingForm) {
		const validationMessages = {
			name: 'Please enter your full name.',
			company: 'Please enter your company name.',
			email: 'Please enter a valid email address.',
			phone: 'Please enter a valid phone or WhatsApp number.',
			product: 'Please enter the product you need.',
			quantity: 'Please enter the required quantity.',
			destination: 'Please select a destination country.',
			packaging: 'Please select your preferred packaging.',
			preferredDate: 'Please select your preferred date.',
			notes: 'Please add at least a few details about your requirements.'
		};

		if (preferredDate) {
			const localNow = new Date();
			localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
			preferredDate.min = localNow.toISOString().split('T')[0];
		}

		bookingForm.querySelectorAll('input, select, textarea').forEach((field) => {
			field.addEventListener('input', () => field.setCustomValidity(''));
			field.addEventListener('change', () => field.setCustomValidity(''));
			field.addEventListener('invalid', () => {
				field.setCustomValidity(validationMessages[field.name] || 'Please complete this field.');
			});
		});

		if (destinationCountry) {
			fetch('https://countriesnow.space/api/v0.1/countries')
				.then((response) => {
					if (!response.ok) throw new Error('Country service unavailable');
					return response.json();
				})
				.then((response) => {
					const countries = [...new Set((response.data || []).map((item) => item.country).filter(Boolean))]
						.sort((first, second) => first.localeCompare(second));

					if (!countries.length) throw new Error('No countries returned');

					destinationCountry.replaceChildren(new Option('Select destination country', ''));
					countries.forEach((country) => destinationCountry.add(new Option(country, country)));
					destinationCountry.disabled = false;
				})
				.catch(() => {
					destinationCountry.replaceChildren(new Option('Country list unavailable — please reload', ''));
					destinationCountry.disabled = true;
					if (bookingStatus) bookingStatus.textContent = 'We could not load the country list. Please reload the page and try again.';
				});
		}

		bookingForm.addEventListener('submit', (event) => {
			event.preventDefault();
			if (destinationCountry?.disabled) {
				if (bookingStatus) bookingStatus.textContent = 'Please wait for the destination country list to load.';
				return;
			}
			const emptyField = [...bookingForm.querySelectorAll('input, select, textarea')]
				.find((field) => field.required && !field.disabled && !field.value.trim());
			if (emptyField) {
				emptyField.setCustomValidity(validationMessages[emptyField.name] || 'Please complete this field.');
				emptyField.reportValidity();
				return;
			}
			if (!bookingForm.checkValidity()) {
				bookingForm.reportValidity();
				return;
			}
			const details = new FormData(bookingForm);
			const value = (field) => details.get(field)?.trim() || 'Not specified';
			const message = [
				'Hello LOKI ORIGIN GLOBAL, I would like to request a quotation.',
				'',
				`Name: ${value('name')}`,
				`Company: ${value('company')}`,
				`Email: ${value('email')}`,
				`Phone / WhatsApp: ${value('phone')}`,
				`Product: ${value('product')}`,
				`Quantity: ${value('quantity')}`,
				`Destination: ${value('destination')}`,
				`Packaging: ${value('packaging')}`,
				`Preferred date: ${value('preferredDate')}`,
				`Additional requirements: ${value('notes')}`
			].join('\n');

			if (bookingStatus) bookingStatus.textContent = 'Opening WhatsApp with your quotation request…';
			window.location.href = `https://wa.me/8555009330?text=${encodeURIComponent(message)}`;
		});
	}

	const carousel = document.querySelector('.product-carousel');
	if (carousel) {
		const track = carousel.querySelector('.carousel-track');
		const slides = [...carousel.querySelectorAll('.product-slide')];
		const dots = carousel.querySelector('.carousel-dots');
		const previous = carousel.querySelector('.carousel-previous');
		const next = carousel.querySelector('.carousel-next');
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let activeSlide = 0;
		let autoplay;

		const showSlide = (index) => {
			activeSlide = (index + slides.length) % slides.length;
			track.style.transform = `translateX(-${activeSlide * 100}%)`;
			slides.forEach((slide, slideIndex) => slide.setAttribute('aria-hidden', String(slideIndex !== activeSlide)));
			[...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-selected', String(dotIndex === activeSlide)));
		};

		slides.forEach((slide, index) => {
			const dot = document.createElement('button');
			dot.type = 'button';
			dot.className = 'carousel-dot';
			dot.setAttribute('role', 'tab');
			dot.setAttribute('aria-label', `Show ${slide.querySelector('h3').textContent}`);
			dot.addEventListener('click', () => showSlide(index));
			dots.append(dot);
		});

		const stopAutoplay = () => window.clearInterval(autoplay);
		const startAutoplay = () => {
			if (!reduceMotion) autoplay = window.setInterval(() => showSlide(activeSlide + 1), 4500);
		};

		previous.addEventListener('click', () => showSlide(activeSlide - 1));
		next.addEventListener('click', () => showSlide(activeSlide + 1));
		carousel.addEventListener('mouseenter', stopAutoplay);
		carousel.addEventListener('mouseleave', () => { stopAutoplay(); startAutoplay(); });
		carousel.addEventListener('focusin', stopAutoplay);
		carousel.addEventListener('focusout', () => { stopAutoplay(); startAutoplay(); });
		showSlide(0);
		startAutoplay();
	}
})();
