# Icône de l'application

Pour le moment, créez votre propre icône `icon.png` (512x512px) et placez-la dans le dossier `public/`.

## Exemple avec ImageMagick :

```bash
# Créer une icône simple
convert -size 512x512 xc:none -fill "#3b82f6" -draw "circle 256,256 256,50" \
  -fill white -font Arial -pointsize 200 -gravity center -annotate +0+0 "GS" \
  public/icon.png
```

## Ou utilisez un outil en ligne :
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

## Recommandations :
- Format : PNG avec transparence
- Taille : 512x512px minimum
- Contenu : Initiales "GS" ou logo de votre école
- Couleur : Bleu (#3b82f6) pour cohérence avec le thème
] 