## [0.8.0](https://github.com/IQGeo/utils-project-update/compare/v0.7.0...v0.8.0) (2/24/25)

- feat: handle tsconfig.json (#18) ([3366a4b](https://github.com/IQGeo/utils-project-update/commit/3366a4b2c49f11ba2f9c23af816066b67fd5da5f))
- docs(changelog): v0.7.0 ([16112b4](https://github.com/IQGeo/utils-project-update/commit/16112b40d18c719d89b0569a05884962bb52c32c))

## [0.7.0](https://github.com/IQGeo/utils-project-update/compare/v0.6.2...v0.7.0) (2/12/25)

- chore: playground pull (#17) ([cd553ab](https://github.com/IQGeo/utils-project-update/commit/cd553ab2cf08f889c4045b062673af66c69985fc))
- ET-274: transform: fix semver version check (gt instead of gte) and slash fix ([370df49](https://github.com/IQGeo/utils-project-update/commit/370df49f8d41c7654628d4bb1f7920ee16abbfb2))
- ET-274: transform: fix semver version check, add semver package ([880bf63](https://github.com/IQGeo/utils-project-update/commit/880bf63a435f6b4c16faec76a6aba2294fc8fadb))
- fix transform to handle new PRODUCT_REGISTRY variable in the template ([4bef769](https://github.com/IQGeo/utils-project-update/commit/4bef7698919a5a9d94a77e4a35e2184f6bb78a98))
- ET-274: transform: adjust to handle new container registry paths ([8aa4d53](https://github.com/IQGeo/utils-project-update/commit/8aa4d53922501bc877756889cf167a69fc9ad0bf))
- docs(changelog): v0.6.2 ([45d995b](https://github.com/IQGeo/utils-project-update/commit/45d995b740312f6ffe7912180091d9f811b099e4))

## [0.6.2](https://github.com/IQGeo/utils-project-update/compare/v0.6.1...v0.6.2) (12/4/24)

- PLAT-11001: transform: module injection: remove --link when using COPY --from (#15) ([5e607e9](https://github.com/IQGeo/utils-project-update/commit/5e607e9fa6f1e04fc2b3de8233015c760bdfda7b))
- docs(changelog): v0.6.1 ([6b7bef0](https://github.com/IQGeo/utils-project-update/commit/6b7bef043538936c4ac15fc6390e2802a53d65b1))

## [0.6.1](https://github.com/IQGeo/utils-project-update/compare/v0.6.0...v0.6.1) (10/31/24)

- update: some minor transform regex fixes ([25f9697](https://github.com/IQGeo/utils-project-update/commit/25f96973f09dc1db8f5325fa36b323d39b387ef0))
- docs(changelog): v0.6.0 ([e4122bd](https://github.com/IQGeo/utils-project-update/commit/e4122bd4c11101bad23bae6f774ce81135647326))

## [0.6.0](https://github.com/IQGeo/utils-project-update/compare/v0.5.0...v0.6.0) (10/31/24)

- PLAT-9955: pull: better handling of unexpected keys (#11) ([9f0ab57](https://github.com/IQGeo/utils-project-update/commit/9f0ab5777783d029a78fdc4b83bc4e9c227e4ef3))
- PLAT-9953: update: update build image tag with prefix ([92a7164](https://github.com/IQGeo/utils-project-update/commit/92a71648ec2d3784a43dbe48ab7e7e119230f215))
- chore(transform): format ([7b129cd](https://github.com/IQGeo/utils-project-update/commit/7b129cdafe812cf6e9f338ad643678d290b6708a))
- PLAT-9954: pull: update template version in project iqgeorc ([0b6ee46](https://github.com/IQGeo/utils-project-update/commit/0b6ee462a266a5319f10619519c9c78d68822e06))
- PLAT-9957: pull: include .vscode/tasks.json ([8e28d59](https://github.com/IQGeo/utils-project-update/commit/8e28d595e5a27226158376653c3c17e68972c72e))
- transform.js: improve replacement pattern matching (#9) ([b839cbf](https://github.com/IQGeo/utils-project-update/commit/b839cbf869109ec57a42bb526a8dfa8538a5f394))

## [0.5.0](https://github.com/IQGeo/utils-project-update/compare/v0.4.0...v0.5.0) (7/29/24)

-   PLAT-9863: several improvements (a5ab0b)(https://github.com/IQGeo/utils-project-update/commit/a5ab0bc70c1accfd8a926d238ceef2fd5de95b5a)

*   update: include custom folder in .gitignore when not part of project
*   transform: fix spurious FROM lines in dockerfile.build
    when the module is set to devOnly
*   pull: include entrypoint and oidc conf files
*   move readConfig to its own file
    so it can be used in pull command
*   add support for a exclude_file_paths option

## [0.4.0](https://github.com/IQGeo/utils-project-update/compare/v0.3.2...v0.4.0) (7/22/24)

-   transform: include new files ([321aa9a](https://github.com/IQGeo/utils-project-update/commit/321aa9a6eb7a8279ab447335be86dbd5ffab2720))
-   pull: rename variable and improve comments ([17e8122](https://github.com/IQGeo/utils-project-update/commit/17e81224ca719cde8ff4051d0318bb828094f23a))
-   update: update transform for new template ([f917bd1](https://github.com/IQGeo/utils-project-update/commit/f917bd1b1ad747d63deb815cd929dd3861ea216d))
-   playground: pull ([fd752c9](https://github.com/IQGeo/utils-project-update/commit/fd752c9315ae3f26ef7bd6863c005583b6347c15))
-   ensure new directories exist ([ed05409](https://github.com/IQGeo/utils-project-update/commit/ed054092d1aebd74d123e8b6f892b374122a57eb))
-   pull: add new files in template to list ([ca37aad](https://github.com/IQGeo/utils-project-update/commit/ca37aadaecff9a263a278322312c2c07523d33ce))
-   docs(changelog): v0.3.2 ([755af4b](https://github.com/IQGeo/utils-project-update/commit/755af4bb89f9e789cd7ce6016c9c3bf3c53be39f))

## [0.3.2](https://github.com/IQGeo/utils-project-update/compare/v0.3.1...v0.3.2) (7/22/24)

-   modules: schema names: add missing schema names (#6) ([3d219f4](https://github.com/IQGeo/utils-project-update/commit/3d219f43108c63a9395bd4c78ca342e537a5e776))
-   transform: support newer platform-devenv (#5) ([5233b43](https://github.com/IQGeo/utils-project-update/commit/5233b43de3b76c8dc9ac0e03869cd64ec5e7c57f))
-   docs: update npm link notes in readme ([3a72252](https://github.com/IQGeo/utils-project-update/commit/3a7225286f44a7b0280bfefbf0f6138b267e7328))
-   docs(changelog): v0.3.1 ([e3378e5](https://github.com/IQGeo/utils-project-update/commit/e3378e5edff703596cdb616a40f1f32d6ed8a9c3))

## [0.3.1](https://github.com/IQGeo/utils-project-update/compare/v0.3.0...v0.3.1) (6/19/24)

-   update: fix .gitignore generation for modules ([0f274dc](https://github.com/IQGeo/utils-project-update/commit/0f274dccc41040c01c8e17c27c015fb22686aee2))
-   docs(changelog): v0.3.0 ([91a6300](https://github.com/IQGeo/utils-project-update/commit/91a63005de6acdc05acda07c66415324b0db53ee))

## [0.3.0](https://github.com/IQGeo/utils-project-update/compare/v0.2.0...v0.3.0) (6/17/24)

-   pull: add pull command (#2) ([1d416c5](https://github.com/IQGeo/utils-project-update/commit/1d416c55adbb07d09bc505cb220f34e3104d2bb8))
-   update: improve init_db entrypoint (#3) ([f341eca](https://github.com/IQGeo/utils-project-update/commit/f341ecabad4074d6d10c611c1f0ce4a1ffd2456e))
-   docs(changelog): v0.2.0 ([90006b3](https://github.com/IQGeo/utils-project-update/commit/90006b3262351cdbcf8917c3639e5a0d80d8113f))

## [0.2.0](https://github.com/IQGeo/utils-project-update/compare/v0.1.0...v0.2.0) (6/5/24)

-   transform: handle NRO/OSM dependencies ([fc6c5d6](https://github.com/IQGeo/utils-project-update/commit/fc6c5d61a96647fcfc4bd4cf05992cd27ac47962))
-   fix to playground script ([5e505e9](https://github.com/IQGeo/utils-project-update/commit/5e505e91d6b470decc212cafa96500d31ba37bcd))
-   transform: fix issue where devenv dependencies were being applied to appserver ([e0b9ac7](https://github.com/IQGeo/utils-project-update/commit/e0b9ac720f2549a7d0bde3645deefa9a3dac8fdc))
-   transform: set .gitignore for product modules ([dbb7004](https://github.com/IQGeo/utils-project-update/commit/dbb70048f2d41d1dec7298d7bb3d7b87ea840681))
-   docs(changelog): v0.1.0 ([dbae705](https://github.com/IQGeo/utils-project-update/commit/dbae7050a83bb21e61ab5bdb1d4186c77728f425))

## [0.1.0](https://github.com/IQGeo/utils-project-update/tags) (5/28/24)

-   release: use require instead of import for json ([8028b04](https://github.com/IQGeo/utils-project-update/commit/8028b04af9dc8c91d9dffde00b0a58c938715de5))
-   types: add empty export so vscode treats the file as a module and resolves types correctly when used as installed package ([2159348](https://github.com/IQGeo/utils-project-update/commit/21593487cb744bd790c55010fd50fccbad7690f0))
-   cli: parse args with yargs ([a578830](https://github.com/IQGeo/utils-project-update/commit/a5788303d5d365d095c5c58aa1bfb46c7a42b651))
-   options: progress handler ([4ba8b80](https://github.com/IQGeo/utils-project-update/commit/4ba8b806f613a2f6e580b955da07a19e149bb581))
-   docs: readme ([98bb80c](https://github.com/IQGeo/utils-project-update/commit/98bb80ce2d451fc967b1c4047a8444f0542c31ae))
-   playground: add scripts for cli and js usage ([a2f68c2](https://github.com/IQGeo/utils-project-update/commit/a2f68c29bd95b3586a04c116574b34eba1b8173c))
-   js: fix updateFiles error reporting ([0b54008](https://github.com/IQGeo/utils-project-update/commit/0b540080c0f4aeee33359fbd8bc9eea009318aec))
-   cli: fix root flag parsing ([0f76c4e](https://github.com/IQGeo/utils-project-update/commit/0f76c4e87ce056390b34035a6ec228eb02d3bb70))
-   eslint: align settings with platform core ([3474c65](https://github.com/IQGeo/utils-project-update/commit/3474c65429ceb119d328df561412e1b1022db468))
-   playground: add script to pull latest project-template from remote ([fce665a](https://github.com/IQGeo/utils-project-update/commit/fce665a8329ccc3e9d88886c12b0cfc7946bb611))
-   vscode: add cspell ignore words ([28b0e4a](https://github.com/IQGeo/utils-project-update/commit/28b0e4a2e50ea4a35ad387351c7b4959cd7aedeb))
-   release: add changenog ([bb4210f](https://github.com/IQGeo/utils-project-update/commit/bb4210ffec2f2a5f9a2db85e96549d3390b42a15))
-   js: cli: add bin entrypoint ([09d7ddd](https://github.com/IQGeo/utils-project-update/commit/09d7ddd64cde6f610659473e113d494092d9e2f2))
-   js: add jsdoc typing and refactor to fix eslint errors ([757ce3b](https://github.com/IQGeo/utils-project-update/commit/757ce3b269974a463c8c9d8e78f72374c30d7fcc))
-   Initial commit ([ca6eca2](https://github.com/IQGeo/utils-project-update/commit/ca6eca2b4780e6d17125340be6778efc9e62be97))