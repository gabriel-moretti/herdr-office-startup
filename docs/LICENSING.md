# Licensing and provenance policy

## Project license

[LICENSE](../LICENSE) contains the full Apache License 2.0 for original code/tooling. [art/LICENSE](../art/LICENSE) and [assets/LICENSE](../assets/LICENSE) contain the full CC Attribution 4.0 International legal code for own visual material to the extent rights are held. These are separate scopes; root Apache does not silently relicense MIT/ISC upstream files or third-party images. Repo publication is public OSS, not a ban on commercial reuse.

Why Apache rather than MIT for own code: aligns with Herdr/Munza Apache-derived portions and provides an express patent grant/retaliation mechanism. MIT would be reasonable for entirely new code but would not erase upstream Apache conditions. Licenses are not warranties; this policy is operational guidance, not legal advice.

## Required when importing licensed code

- **MIT (cybertron root / PixelHQ portions):** include copyright and permission text in copies/substantial portions. Do not replace it with just an Apache SPDX line. The root license does not override transitive exceptions; each keeps its own license text.
- **Apache (munza/Herdr):** include full license; retain relevant copyright/patent/trademark/attribution notices; prominently mark modified source files; carry relevant attribution from upstream NOTICE in distributed readable NOTICE/docs. NOTICE is informational, not extra restrictions. Preserve exact authors/years, not invented replacement ownership.
- **cybertron transitive:** CI base Douglas Cunha 2026 MIT; filetree Kurt Buhler 2026 MIT if used; Material Icon Theme Material Extensions 2025 MIT; yaml 2.8.1 Eemeli Aro ISC if copied; Herdr-derived Files/file-icons Apache 2.0. Copy applicable license files before release.
- **munza NOTICE:** Tawsif Aqib 2026 and Herdr-derived modules/icons; retain only relevant attribution, not unrelated components as if imported.
- Record URL, full upstream commit, source/destination paths, license, original headers/NOTICE and modifications. Ship LICENSE/NOTICE/THIRD_PARTY_NOTICES/LICENSES in runtime ZIP, not just source repo.

No upstream implementation is imported in this starter. [NOTICE](../NOTICE) is an explicit conditional preservation checklist, not a false claim that all candidate modules are bundled. Once code is actually imported, replace conditions with exact shipped inventory.

## Prohibited / uncertain inputs

No Pokémon sprites/portraits/scenes/cries/marks or downloader dependencies. MIT code does not license CC BY-NC SpriteCollab art or trademark rights, and public OSS does not make NC materials suitable for unrestricted redistribution. Original art is mandatory for this project.

Do not copy dhoaibao/git-panel or coldtatooine/brutal-metrics code without permission: no license was identified in prior research. Study requirements and independently implement; do not transform copied code into “new” code by renaming.

## AI-assisted artwork

Generated concepts/source artwork in this kit are declared in [PROVENANCE](../art/PROVENANCE.md). Terms applying to the generation service should be reviewed by the owner before public release; no model/provider ownership terms have been invented or certified here. Save any applicable terms/version evidence if available. Copyright in AI-only output and the scope of human edits depend on jurisdiction; do not promise exclusivity or grant rights that do not exist. CC BY only applies where there are rights to license; public-domain elements do not acquire copyright by adding a file.

Source inputs were project-generated concepts, not Pokémon assets or portraits of real people. Keep original prompts/source images, declare Pillow crops/palette/keyframe synthesis and manual cleanup. Review similarity and third-party rights before production. The included placeholder art is not a legal guarantee of non-infringement or a final art approval.

## Authoritative sources

- Apache text/section 4: https://www.apache.org/licenses/LICENSE-2.0
- MIT: https://opensource.org/license/mit
- CC BY 4.0 deed/legal code: https://creativecommons.org/licenses/by/4.0/ and https://creativecommons.org/licenses/by/4.0/legalcode.en
- Cybertron notices: https://github.com/cybertron288/herdr-mods/blob/34e7c33/THIRD_PARTY_NOTICES.md
- Munza notices: https://github.com/munza/herdr-mods/blob/2bd4870/NOTICE

Before first public release: verify imported inventory, rights in source references, appropriate notices and terms; reviewers confirm technical/legal checklist, not a blanket warranty.
