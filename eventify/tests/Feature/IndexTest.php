<?php

it('displays the index page', function () {
    $page = visit('/');

    $page->assertSee('Markus');
});
