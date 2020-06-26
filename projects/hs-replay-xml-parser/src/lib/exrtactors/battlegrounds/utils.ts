export const normalizeHeroCardId = (heroCardId: string): string => {
	if (heroCardId === 'TB_BaconShop_HERO_59t') {
		return 'TB_BaconShop_HERO_59';
	}
	return heroCardId;
};
