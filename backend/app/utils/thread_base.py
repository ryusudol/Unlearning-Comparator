"""
Base classes for thread operations to reduce code duplication.
"""
import threading
import asyncio
from typing import Any


class BaseUnlearningThread(threading.Thread):
    """
    Base class for unlearning threads with common functionality.
    """
    
    def __init__(self):
        threading.Thread.__init__(self)
        self.exception = None
        self.loop = None
        self._stop_event = threading.Event()
    
    def stop(self):
        """Stop the thread execution."""
        self._stop_event.set()
    
    def stopped(self):
        """Check if thread should stop."""
        return self._stop_event.is_set()
    
    def run(self):
        """Main thread execution with async loop setup."""
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.async_main())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()
    
    async def async_main(self):
        """Override this method in subclasses for async execution."""
        raise NotImplementedError("Subclasses must implement async_main")
    
    def check_stopped_and_return(self, status: Any) -> bool:
        """
        Check if stopped and update status if needed.
        
        Args:
            status: Status object to update
            
        Returns:
            True if stopped, False otherwise
        """
        if self.stopped():
            status.is_unlearning = False
            print("\nOperation cancelled.")
            return True
        return False


class BaseTrainingThread(threading.Thread):
    """
    Base class for training threads with common functionality.
    """
    
    def __init__(self):
        threading.Thread.__init__(self)
        self.exception = None
        self.loop = None
        self._stop_event = threading.Event()
    
    def stop(self):
        """Stop the thread execution."""
        self._stop_event.set()
    
    def stopped(self):
        """Check if thread should stop."""
        return self._stop_event.is_set()
    
    def run(self):
        """Main thread execution with async loop setup."""
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.async_main())
        except Exception as e:
            self.exception = e
        finally:
            if self.loop:
                self.loop.close()
    
    async def async_main(self):
        """Override this method in subclasses for async execution."""
        raise NotImplementedError("Subclasses must implement async_main")
    
    def check_stopped_and_return(self, status: Any) -> bool:
        """
        Check if stopped and update status if needed.
        
        Args:
            status: Status object to update
            
        Returns:
            True if stopped, False otherwise
        """
        if self.stopped():
            status.is_training = False
            print("\nTraining cancelled.")
            return True
        return False