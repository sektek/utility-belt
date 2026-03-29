# Changelog

## [0.2.5](https://github.com/sektek/utility-belt/compare/v0.2.4...v0.2.5) (2026-03-29)

## [0.2.4](https://github.com/sektek/utility-belt/compare/v0.2.3...v0.2.4) (2026-03-28)

### Features

* Add Named type and Process Manager implementation ([#35](https://github.com/sektek/utility-belt/issues/35)) ([2886462](https://github.com/sektek/utility-belt/commit/2886462f37cfe22953325e439e0b34f9768fa4e3))

## [0.2.3](https://github.com/sektek/utility-belt/compare/v0.2.2...v0.2.3) (2026-03-21)

### Bug Fixes

* shrink down package size ([#34](https://github.com/sektek/utility-belt/issues/34)) ([d91fbbd](https://github.com/sektek/utility-belt/commit/d91fbbdc8d15c809814d0b241419c1b03cf1eb44))

## [0.2.2](https://github.com/sektek/utility-belt/compare/v0.2.0...v0.2.2) (2026-03-21)

## [0.2.1](https://github.com/sektek/utility-belt/compare/v0.2.0...v0.2.1) (2026-03-21)

## 0.2.0 (2026-03-21)

### ⚠ BREAKING CHANGES

* move ProviderWrapper to DefaultProvider. Remove functional form (#10)
* Update default type parameters to void in provider interfaces (#9)
* Updated getComponent to accept options instead of a fallback value.

### Features

* add Command, Startable, Stoppable types ([#14](https://github.com/sektek/utility-belt/issues/14)) ([487fee1](https://github.com/sektek/utility-belt/commit/487fee10bcbe6b627509654a52b985ccc747789c))
* add mutator, optional provider, predicate, sync provider, and sync predicate types ([6db57d3](https://github.com/sektek/utility-belt/commit/6db57d348eccf8515b77475790fc867fc7807a72))
* add negate function and NegatedPredicate class for predicate negation ([30d47db](https://github.com/sektek/utility-belt/commit/30d47db1afb1eb27ce98088b6530b572fbc7b7d1))
* Add NullLogger and NullLoggerProvider implementations ([#20](https://github.com/sektek/utility-belt/issues/20)) ([90f7585](https://github.com/sektek/utility-belt/commit/90f758528c45a375aab0d76e3d3d4ac2af9fa358))
* add Repository type for data management with CRUD operations ([fe09d07](https://github.com/sektek/utility-belt/commit/fe09d07251a9b423185e0a747338bb3ba92f2ee4))
* Add reset method to SingletonProvider ([#21](https://github.com/sektek/utility-belt/issues/21)) ([71b6f6e](https://github.com/sektek/utility-belt/commit/71b6f6ec390d984c00a8c3846f8f880dd57faf3e))
* add sleep utility ([#27](https://github.com/sektek/utility-belt/issues/27)) ([3c56951](https://github.com/sektek/utility-belt/commit/3c5695173a248580b2754c504818a9ba5416070b))
* Add syntactic sugar for composite predicates ([#19](https://github.com/sektek/utility-belt/issues/19)) ([3365ad0](https://github.com/sektek/utility-belt/commit/3365ad086b60785d81778909e9c0423b126f0610))
* add TimeSensitiveOptionalProvider and TimeSensitiveProvider with timeout functionality ([8a76fd1](https://github.com/sektek/utility-belt/commit/8a76fd1b77ebba655598c2573e74dae3d2b3a37b))
* added initial component system ([f407ee6](https://github.com/sektek/utility-belt/commit/f407ee6f4ed2d29afeceb396ff02aef426bdd738))
* Adds iterable provider, collection and collector ([#8](https://github.com/sektek/utility-belt/issues/8)) ([4441311](https://github.com/sektek/utility-belt/commit/44413118b31034217fd28795526b56f3da05b322))
* Builder functions ([#1](https://github.com/sektek/utility-belt/issues/1)) ([92e992d](https://github.com/sektek/utility-belt/commit/92e992d0b4670f1cfe59102efe2bbc23e4e1f1d0))
* Enhance execution strategies with async iterable support and improved error handling ([#11](https://github.com/sektek/utility-belt/issues/11)) ([8b4da4c](https://github.com/sektek/utility-belt/commit/8b4da4cc76379efd2f6e3eca9fb034896adbfca2))
* enhance ProviderWrapper to support default value providers and improve error handling ([d645c75](https://github.com/sektek/utility-belt/commit/d645c75a4af0cdfb87f461d0471f6a3bc3559fb0))
* EventEmittingService ([#2](https://github.com/sektek/utility-belt/issues/2)) ([79a26bb](https://github.com/sektek/utility-belt/commit/79a26bb6138bead9b89f997a9dc134432696b4f8))
* Generic error handler type ([#15](https://github.com/sektek/utility-belt/issues/15)) ([fa2fea3](https://github.com/sektek/utility-belt/commit/fa2fea340a0a017cbfadd625e8bf77e81452f9e5))
* Generic execution strategies and store interface ([b39ae51](https://github.com/sektek/utility-belt/commit/b39ae51b0b9de0c4179856a1ebb18cefd0548d4a))
* HttpProviders ([#3](https://github.com/sektek/utility-belt/issues/3)) ([e85572d](https://github.com/sektek/utility-belt/commit/e85572d2ea9bdefeb422e9cfae1c0aab2da03d6c))
* implement composite predicates with AllPredicate, AnyPredicate, NonePredicate, and NegatedPredicate ([480f755](https://github.com/sektek/utility-belt/commit/480f7558167a8e93acecf49242540abfeea41c3e))
* implement HttpOperator with request handling and event emission ([d150c31](https://github.com/sektek/utility-belt/commit/d150c31d99968fb51a4dd6cab836b49467b6820f))
* implement ProcessingProvider for putting a provider through a processor prior to returning the value ([#13](https://github.com/sektek/utility-belt/issues/13)) ([0c447b2](https://github.com/sektek/utility-belt/commit/0c447b2a8224ea179de7ede31b5e02903fe01dce))
* implement ProviderWrapper and wrapOptionalProvider for optional provider handling ([e422835](https://github.com/sektek/utility-belt/commit/e422835dec5233911b32debf46152a43285c8445))
* Implement Queue class ([#22](https://github.com/sektek/utility-belt/issues/22)) ([c6ec77e](https://github.com/sektek/utility-belt/commit/c6ec77ef53189f0580e2fef4f53ee5c0306872bf))
* Implement take function for async and sync iterables with tests ([#24](https://github.com/sektek/utility-belt/issues/24)) ([f5ffeb8](https://github.com/sektek/utility-belt/commit/f5ffeb8b97f47c6546d0d31c6dccc6c3b1c2821d))
* improve performance for large queues and prevent concurrent iteration ([#26](https://github.com/sektek/utility-belt/issues/26)) ([18676a0](https://github.com/sektek/utility-belt/commit/18676a08c197089a78c630bb01e552b5b6c2ac20))
* make sleep cancellable ([#28](https://github.com/sektek/utility-belt/issues/28)) ([973f298](https://github.com/sektek/utility-belt/commit/973f298875189dc2d3cf7eefc6e819baf8661869))
* Refactor Builder and implement ObjectBuilder class ([#7](https://github.com/sektek/utility-belt/issues/7)) ([eecb284](https://github.com/sektek/utility-belt/commit/eecb284602aef91a9cda5308d1e1337445fc24dd))
* SingletonProvider ([#18](https://github.com/sektek/utility-belt/issues/18)) ([b3c99f6](https://github.com/sektek/utility-belt/commit/b3c99f67ab67531377c49abb0bafd7a7ac6b2b0c))
* Update CollectorFn type and implement ArrayCollection ([#23](https://github.com/sektek/utility-belt/issues/23)) ([1afdcf8](https://github.com/sektek/utility-belt/commit/1afdcf8c64cb789049c3896ea0cdaa2f000582ff))
* update ProviderFn and Provider interfaces to support argument types ([bb3d902](https://github.com/sektek/utility-belt/commit/bb3d902ce9bfe7495e23247bb70355a9e0d8af1e))
* Updated getComponent to accept options instead of a fallback value. ([bc36929](https://github.com/sektek/utility-belt/commit/bc36929f1061f7024c0575a305bbce46f78abf13))

### Bug Fixes

* Added missing InvalidComponentError ([82461ef](https://github.com/sektek/utility-belt/commit/82461ef2e77ff8ac5917bce1909365cf0d8a1099))
* Component should return never when T is never ([c16da68](https://github.com/sektek/utility-belt/commit/c16da68f50763538b69e8588c76ee88f3123f132))
* fallback for getComponent should be T not T | R ([47b63f4](https://github.com/sektek/utility-belt/commit/47b63f4799d89e25ea38606ebd91eebfd9976c55))
* get-component defaultProvider typing ([12b1c4c](https://github.com/sektek/utility-belt/commit/12b1c4c8c7bf03ade4255080f185b13f2275f9d5))
* **http:** import paths and add type annotations ([9ad8924](https://github.com/sektek/utility-belt/commit/9ad8924e71bf19121a8c02889dc3be52e71b0cb5))
* minor Execution Strategy Updates missed commits ([#12](https://github.com/sektek/utility-belt/issues/12)) ([f4415e2](https://github.com/sektek/utility-belt/commit/f4415e20af46645bced27bd3716021ef7ad0bff6))
* removed .npmrc ([56c4a92](https://github.com/sektek/utility-belt/commit/56c4a928f593cf92d7161a3d51a21997257e7316))
* Update default type parameters to void in provider interfaces ([#9](https://github.com/sektek/utility-belt/issues/9)) ([720a52d](https://github.com/sektek/utility-belt/commit/720a52df918b4f34f8a3ce52db76e0cceea705b0))
* update provider interfaces ([165916d](https://github.com/sektek/utility-belt/commit/165916d10db7f38af7fb88f9558a46392ceeac49))

### Miscellaneous Chores

* move ProviderWrapper to DefaultProvider. Remove functional form ([#10](https://github.com/sektek/utility-belt/issues/10)) ([f8bdf5b](https://github.com/sektek/utility-belt/commit/f8bdf5bf3d51c68b06cb273775e4183a7a003909))
