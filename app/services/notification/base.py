from abc import ABC,abstractmethod
class NotificationChannel(ABC):
    channel:str
    @abstractmethod
    async def send(self,user,title,body,destination): ...
