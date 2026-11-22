# conda-forge feedstock draft

This directory holds a draft [`meta.yaml`](./meta.yaml) for publishing `limetry`
to [conda-forge](https://conda-forge.org/).

## After the first PyPI release

1. Confirm `https://pypi.org/project/limetry/` shows the target version.
2. Compute the sdist SHA256 and set `sha256` in `meta.yaml`.
3. Open a PR against [conda-forge/staged-recipes](https://github.com/conda-forge/staged-recipes)
   with a `recipes/limetry/` folder containing this recipe (plus a short `README`).
4. Once the feedstock exists, conda-forge bots bump versions from PyPI automatically.
5. Users install with:

```bash
conda install -c conda-forge limetry
# or
mamba install -c conda-forge limetry
```

PyPI remains the primary publish path (`.github/workflows/publish-pypi.yml`).
conda-forge is the second public channel for ML / agent environments.
