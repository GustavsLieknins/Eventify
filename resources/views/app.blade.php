<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title inertia>{{ config('app.name', 'Laravel') }}</title>
    <link rel="icon" type="image/x-icon" href="/img/eventify-logo2.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/globe.gl" data-globe-cdn="true" data-loaded="true"></script>



    @routes

    @viteReactRefresh
    @vite(['resources/js/app.jsx'])

    @inertiaHead
    <meta name="csrf-token" content="{{ csrf_token() }}">
  </head>
  <body class="font-sans antialiased">
    @inertia
  </body>
</html>
