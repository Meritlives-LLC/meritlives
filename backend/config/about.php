<?php

return [
    'defaults' => json_decode(file_get_contents(base_path('../content/about.json')), true, 512, JSON_THROW_ON_ERROR),
    // These are the existing frontend service/product catalogue entries, not new records.
    'services' => [
        'web-development' => 'Web Development', 'fintech' => 'Fintech Solutions', 'edtech' => 'EdTech Solutions',
        'business-automation' => 'Business Automation', 'education' => 'Education Technology Services',
        'real-estate' => 'Real Estate Technology', 'security' => 'Security Technology',
        'ongoing-maintenance' => 'Ongoing Maintenance and Support',
    ],
    'products' => ['skillhub' => 'SkillHub', 'bookmarketing' => 'BookMarketing', 'wauabot' => 'Wauabot', 'audioflow' => 'Audioflow', 'politcs' => 'Politcs'],
];
