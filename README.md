vanillaSwiper
============

A vanilla JS alternative to JS sliders. Using the native touch device scroll and adding arrow buttons for non-touch devices

## Markup

```html
<div class="parent" data-natural-scroll>
    <div class="child"> <!-- Don't style this one since we use padding to separate items -->
        <div class="child__item">This is where the actual styling goes</div>
    </div>
</div>
```

## Initiate
```html
<script>
    vanillaSwiper.init();
</script>
```

## Options
```html
<div class="parent" data-natural-scroll data-scroll-maxwidth="200" data-scroll-until="800">
```