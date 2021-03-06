const Observable = require('../src/Observable');
const assert = require('assert');
const { testMethodProperty } = require('./properties');

describe('observer.complete', () => {

  function getObserver(inner) {
    let observer;
    new Observable(x => { observer = x }).subscribe(inner);
    return observer;
  }

  it('is a method of SubscriptionObserver', () => {
    let observer = getObserver();
    testMethodProperty(Object.getPrototypeOf(observer), 'complete', {
      configurable: true,
      writable: true,
      length: 0,
    });
  });

  it('does not forward arguments', () => {
    let args;
    let observer = getObserver({ complete(...a) { args = a } });
    observer.complete(1);
    assert.deepEqual(args, []);
  });

  it('does not return a value', () => {
    let observer = getObserver({ complete() { return 1 } });
    assert.equal(observer.complete(), undefined);
  });

  it('does not forward when the subscription is complete', () => {
    let count = 0;
    let observer = getObserver({ complete() { count++ } });
    observer.complete();
    observer.complete();
    assert.equal(count, 1);
  });

  it('does not forward when the subscription is cancelled', () => {
    let count = 0;
    let observer;
    let subscription = new Observable(x => { observer = x }).subscribe({
      complete() { count++ },
    });
    subscription.unsubscribe();
    observer.complete();
    assert.equal(count, 0);
  });

  it('throws if the subscription is not initialized', async () => {
    let error;
    new Observable(x => { x.complete() }).subscribe({
      error(err) { error = err },
    });
    await null;
    assert.ok(error instanceof Error);
  });

  it('throws if the observer is running', () => {
    let observer;
    new Observable(x => { observer = x }).subscribe({
      next() { observer.complete() }
    });
    assert.throws(() => observer.next());
  });

  it('closes the subscription before invoking inner observer', () => {
    let closed;
    let observer = getObserver({
      complete() { closed = observer.closed },
    });
    observer.complete();
    assert.equal(closed, true);
  });

  it('throws if "complete" is not a method', () => {
    let observer = getObserver({ complete: 1 });
    assert.throws(() => observer.complete());
  });

  it('does not throw if "complete" is undefined', () => {
    let observer = getObserver({ complete: undefined });
    observer.complete();
    assert.ok(true);
  });

  it('does not throw if "complete" is null', () => {
    let observer = getObserver({ complete: null });
    observer.complete();
    assert.ok(true);
  });

  it('throws if "complete" throws', () => {
    let error = {};
    let observer = getObserver({ complete() { throw error } });
    try {
      observer.complete();
      assert.ok(false);
    } catch (err) {
      assert.equal(err, error);
    }
  });

  it('calls the cleanup method after "complete"', () => {
    let calls = [];
    new Observable(x => {
      observer = x;
      return () => { calls.push('cleanup') };
    }).subscribe({
      complete() { calls.push('complete') },
    });
    observer.complete();
    assert.deepEqual(calls, ['complete', 'cleanup']);
  });

  it('calls the cleanup method if there is no "complete"', () => {
    let calls = [];
    new Observable(x => {
      observer = x;
      return () => { calls.push('cleanup') };
    }).subscribe({});
    observer.complete();
    assert.deepEqual(calls, ['cleanup']);
  });

  it('throws if the cleanup function throws', () => {
    let error = {};
    let observer;
    new Observable(x => {
      observer = x;
      return () => { throw error };
    }).subscribe();
    try {
      observer.complete();
      assert.ok(false);
    } catch (err) {
      assert.equal(err, error);
    }
  });

  it('throws the error from the observer if both throw', () => {
    let observerError = {};
    let observer;
    new Observable(x => {
      observer = x;
      return () => { throw {} };
    }).subscribe({
      complete() { throw observerError },
    });
    try {
      observer.complete();
      assert.ok(false);
    } catch (err) {
      assert.equal(err, observerError);
    }
  });
});
