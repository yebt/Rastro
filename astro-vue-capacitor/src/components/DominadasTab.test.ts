import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { $curSets, $repCount } from '../stores/session';
import DominadasTab from './DominadasTab.vue';

beforeEach(() => {
  $curSets.set([]);
  $repCount.set(8);
});

describe('DominadasTab', () => {
  it('renders the session card', () => {
    const wrapper = mount(DominadasTab, { props: { active: true } });
    expect(wrapper.text()).toContain('Nueva sesión');
    expect(wrapper.text()).toContain('Total histórico');
  });

  it('increments and decrements reps via the stepper', async () => {
    const wrapper = mount(DominadasTab, { props: { active: true } });
    await wrapper.get('button[aria-label="Sumar"]').trigger('click');
    expect($repCount.get()).toBe(9);
    await wrapper.get('button[aria-label="Restar"]').trigger('click');
    await wrapper.get('button[aria-label="Restar"]').trigger('click');
    expect($repCount.get()).toBe(7);
  });

  it('adds a set and shows the save button', async () => {
    const wrapper = mount(DominadasTab, { props: { active: true } });
    expect(wrapper.text()).not.toContain('Guardar sesión');
    await wrapper.get('.btn-go.wide').trigger('click'); // "Agregar serie"
    expect($curSets.get()).toEqual([8]);
    expect(wrapper.text()).toContain('Guardar sesión');
  });
});
