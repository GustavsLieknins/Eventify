<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    {{-- Breeze defaults (Figtree) --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    {{-- (Optional) Your extra fonts – these won’t break Breeze, but Breeze keeps using font-sans from Tailwind --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">

    {{-- 👇 Inject Ziggy’s global route() helper --}}
    @routes

    @viteReactRefresh
    {{-- 👇 IMPORTANT: bring back Breeze CSS first, then your JS --}}
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    @inertiaHead
    {{-- If you use CSRF in fetch() anywhere, this helps: --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">
  </head>
  <body class="font-sans antialiased">
    @inertia
  </body>
</html>
