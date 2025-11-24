import React from 'react';


const LandingFooter = () => {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        
        { name: 'Examples', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#about' },
        { name: 'Blog', href: '#/blog' },
        { name: 'Contact', href: '#contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '#' },
        { name: 'Templates', href: '#' },
        { name: 'Security', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Badges Section - Centered and Side by Side */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
          {/* DMCA Badge */}
          <a
            href="//www.dmca.com/Protection/Status.aspx?ID=3b429a82-a1ac-45e2-8d4e-29804753a560"
            title="DMCA.com Protection Status"
            className="dmca-badge hover:opacity-80  transition-opacity"
          >
            <img
              src="https://images.dmca.com/Badges/DMCA_badge_trn_60w.png?ID=3b429a82-a1ac-45e2-8d4e-29804753a560"
              alt="DMCA.com Protection Status"
            />
          </a>
          
          {/* Note: Script tags inside JSX can be tricky. If this doesn't load, move it to your index.html or useEffect */}
          <script src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"></script>

          {/* Product Hunt Badge */}
          <a
            href="https://www.producthunt.com/products/surveyzen?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-surveyzen"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1041372&theme=light&t=1763890037404"
              alt="SurveyZen - The minimalist survey builder for modern creators. | Product Hunt"
              style={{ width: '210px', height: '99px' }}
              width="100"
              height="99"
            />
          </a>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} SurveyZen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;   