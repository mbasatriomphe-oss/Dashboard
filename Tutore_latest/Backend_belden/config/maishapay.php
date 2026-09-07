<?php

return [
    'form_action' => env('MAISHAPAY_FORM_ACTION', 'https://marchand.maishapay.online/payment/vers1.0/merchant/checkout'),
    'gateway_mode' => env('MAISHAPAY_GATEWAY_MODE', 1),
    'public_api_key' => env('MAISHAPAY_PUBLIC_API_KEY', 'MP-LIVEPK-exeWW4.u0u1R7ufnuFfy2YqkCLKIIn$sJNy6xExi$WOnUgK5yUrH.mP0OxUmzpv19P.bWdQYVgiD$UuH3gF1wZOfY$66/.$CGQSHA2QO7KGq6i$HwQD3u4a0'),
    'secret_api_key' => env('MAISHAPAY_SECRET_API_KEY', 'MP-LIVESK-YG5Aaya$wao1WTUj0Y099t$I.ydY9IzIiNHhwLh11/0nR0JHk7IU3al8/m7hxx$H2kWepyA9F2re48GqrC9eW6XM61rfXkr1/$L$20v0/ohvPHcldB/t4$PD'),
    'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost:3000')),
];
